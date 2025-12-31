import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders } from "../_shared/utils.ts";
import validator from "npm:validator@13.11.0";

/**
 * Smart Email Validation with Adaptive Looping
 *
 * Features:
 * - Self-triggering loop (validates until complete)
 * - Rate limit aware (respects API quotas)
 * - Priority-based validation (high-value contacts first)
 * - Throttle protection (configurable delays)
 * - 100% coverage guarantee
 * - Distributed locking via validation_sessions table
 */

interface ValidationConfig {
  batchSize: number;           // Emails per batch (default: 50)
  maxIterations: number;        // Safety limit to prevent infinite loops (default: 100)
  delayBetweenEmails: number;   // ms between validations (default: 100ms)
  delayBetweenBatches: number;  // ms between batch loops (default: 5000ms = 5s)
  daysStale: number;            // Re-validate after X days (default: 30)
  priorityThreshold: number;    // Days since last activity for priority (default: 90)
}

interface EmailValidationResult {
  email: string;
  status: 'valid' | 'risky' | 'invalid' | 'unknown';
  reason?: string;
}

const DEFAULT_CONFIG: ValidationConfig = {
  batchSize: 20,               // Reduced from 50 to avoid timeouts
  maxIterations: 100,
  delayBetweenEmails: 100,
  delayBetweenBatches: 5000,
  daysStale: 30,
  priorityThreshold: 90,
};

/**
 * Validate email using third-party API (ZeroBounce, Hunter.io, etc.)
 */
async function validateEmailWithAPI(email: string): Promise<EmailValidationResult> {
  const apiKey = Deno.env.get('EMAIL_VALIDATION_API_KEY');

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  try {
    // Example: ZeroBounce API
    const response = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Map ZeroBounce status to our schema
    const statusMap: Record<string, 'valid' | 'risky' | 'invalid' | 'unknown'> = {
      'valid': 'valid',
      'catch-all': 'risky',
      'abuse': 'risky',
      'do_not_mail': 'risky',
      'spamtrap': 'invalid',
      'invalid': 'invalid',
      'unknown': 'unknown',
    };

    return {
      email,
      status: statusMap[data.status] || 'unknown',
      reason: data.sub_status || data.status,
    };
  } catch (error) {
    console.error(`API validation failed for ${email}:`, error);
    throw error;
  }
}

/**
 * Email validation optimized for Edge Functions (no SMTP - Port 25 is blocked)
 * Performs: regex, MX record lookup, disposable detection, typo checking
 *
 * Note: SMTP validation (Port 25) is blocked in Deno Deploy/Edge Functions.
 * For full SMTP validation, use EMAIL_VALIDATION_API_KEY instead.
 */
async function validateEmailWithLibrary(email: string): Promise<EmailValidationResult> {
  try {
    // 1. Regex validation (syntax)
    if (!validator.isEmail(email)) {
      return { email, status: 'invalid', reason: 'Invalid email format' };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return { email, status: 'invalid', reason: 'Missing domain' };
    }

    // 2. Disposable email detection (expanded list)
    const disposableDomains = [
      // Temporary email services
      'tempmail.com', 'temp-mail.org', 'throwaway.email', 'guerrillamail.com',
      'mailinator.com', '10minutemail.com', 'trashmail.com', 'maildrop.cc',
      'getnada.com', 'fakeinbox.com', 'yopmail.com', 'emailondeck.com',
      'sharklasers.com', 'grr.la', 'mytemp.email', 'temp-mail.io',
      // One-time/burner services
      'minuteinbox.com', 'dispostable.com', 'tempmail.net', 'mohmal.com',
      'emailfake.com', 'throwawaymail.com', 'mailnesia.com', 'spamgourmet.com',
    ];

    if (disposableDomains.includes(domain)) {
      return { email, status: 'risky', reason: 'Disposable email domain' };
    }

    // 3. Common typo detection
    const typoMap: Record<string, string> = {
      'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmil.com': 'gmail.com',
      'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com', 'hotmil.com': 'hotmail.com',
      'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com',
      'live.co': 'live.com', 'gmx.co': 'gmx.com',
    };

    if (typoMap[domain]) {
      return {
        email,
        status: 'risky',
        reason: `Possible typo: did you mean ${typoMap[domain]}?`,
      };
    }

    // 4. MX Record validation (DNS-based, works in Edge Functions)
    try {
      const mxRecords = await Deno.resolveDns(domain, 'MX');

      if (!mxRecords || mxRecords.length === 0) {
        return { email, status: 'invalid', reason: 'No mail server (MX records not found)' };
      }

      // Valid: passed regex + has MX records
      return { email, status: 'valid', reason: 'Verified (syntax + MX records)' };
    } catch (dnsError) {
      // DNS lookup failed (domain doesn't exist or network issue)
      console.warn(`MX lookup failed for ${domain}:`, dnsError);
      return { email, status: 'invalid', reason: 'Domain does not exist or has no mail server' };
    }

  } catch (error) {
    console.error(`Library validation error for ${email}:`, error);
    return { email, status: 'unknown', reason: 'Validation error' };
  }
}

/**
 * Main validation function with two-tier strategy
 *
 * Tier 1 (Premium - Recommended):
 *   - Uses external API (ZeroBounce, Hunter.io, etc.) via EMAIL_VALIDATION_API_KEY
 *   - Performs full validation: regex, DNS, MX, SMTP, deliverability, spam traps
 *   - Works around Edge Function Port 25 limitation
 *   - Cost: ~$0.001-0.01 per email (depending on provider)
 *
 * Tier 2 (Free - Limited):
 *   - Edge-optimized validation using Deno DNS APIs
 *   - Checks: regex syntax, MX records, disposable domains, typos
 *   - Cannot verify mailbox existence (SMTP Port 25 blocked in Edge Functions)
 *   - Cost: Free, but less accurate
 *
 * Recommendation: Set EMAIL_VALIDATION_API_KEY for production use
 */
async function validateEmail(email: string): Promise<EmailValidationResult> {
  const apiKey = Deno.env.get('EMAIL_VALIDATION_API_KEY');

  // Try API first if configured (Tier 1)
  if (apiKey) {
    try {
      return await validateEmailWithAPI(email);
    } catch (error) {
      console.warn(`API validation failed for ${email}, falling back to library:`, error);
      return await validateEmailWithLibrary(email);
    }
  }

  // Use library if no API key (Tier 2)
  return await validateEmailWithLibrary(email);
}

/**
 * Get count of contacts needing validation
 * Note: email_jsonb is an array like [{"email": "user@example.com", "type": "Work"}]
 */
async function getValidationQueueSize(config: ValidationConfig): Promise<number> {
  const staleDate = new Date(Date.now() - config.daysStale * 86400000).toISOString();

  try {
    // Query for contacts with emails that need validation
    // email_jsonb is not null and not empty array
    const { count, error } = await supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .not('email_jsonb', 'is', null)
      .neq('email_jsonb', '[]')
      .or(`email_validation_status.is.null,external_heartbeat_checked_at.lt.${staleDate}`);

    if (error) {
      console.error('Failed to get queue size:', {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
        staleDate,
      });
      throw new Error(`Query failed: ${error.message || 'Unknown error'}`);
    }

    return count || 0;
  } catch (err) {
    console.error('Exception in getValidationQueueSize:', err);
    throw err;
  }
}

/**
 * Self-trigger the function for next batch
 */
async function triggerNextBatch(
  iteration: number,
  sessionId: string,
  config: ValidationConfig,
  supabaseUrl: string,
  serviceKey: string
): Promise<void> {
  console.log(`Scheduling next batch (iteration ${iteration + 1}) in ${config.delayBetweenBatches}ms...`);

  // Wait before triggering to avoid overwhelming the system
  await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));

  const url = `${supabaseUrl}/functions/v1/validate-contact-emails?iteration=${iteration + 1}&session_id=${sessionId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });

    if (!response.ok) {
      console.error(`Failed to trigger next batch: ${response.status} ${response.statusText}`);
    } else {
      console.log(`Next batch triggered successfully (iteration ${iteration + 1})`);
    }
  } catch (error) {
    console.error('Error triggering next batch:', error);
  }
}

/**
 * Mark session as completed or failed
 */
async function completeSession(sessionId: string, status: 'completed' | 'failed', message?: string) {
  if (!sessionId) return;
  console.log(`Completing session ${sessionId} with status: ${status}`);
  
  const { error } = await supabaseAdmin.rpc('complete_validation_session', {
    p_session_id: sessionId,
    p_status: status,
    p_error_message: message
  });
  
  if (error) {
    console.error('Failed to complete session:', error);
  }
}

/**
 * Update session progress
 */
async function updateSession(sessionId: string, validatedCount: number, iteration: number) {
  if (!sessionId) return;
  
  const { error } = await supabaseAdmin.rpc('update_validation_session', {
    p_session_id: sessionId,
    p_validated_count: validatedCount,
    p_iteration: iteration
  });
  
  if (error) {
    console.error('Failed to update session:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const startTime = Date.now();
  let sessionId: string | undefined;

  try {
    // Debug: Check environment configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const hasServiceKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl || 'NOT SET',
      hasServiceKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
    });

    if (!supabaseUrl || !hasServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    // Test database connectivity with a simple query
    console.log('Testing database connectivity...');
    const { data: testTables, error: testError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Database connectivity test failed:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code,
      });
      throw new Error(`Database connection failed: ${testError.message || 'Unknown error'}`);
    }

    console.log('✅ Database connectivity OK');

    // Check if required columns exist
    console.log('Checking for email validation columns...');
    const { data: columnTest, error: columnError } = await supabaseAdmin
      .from('contacts')
      .select('id, email_jsonb, email_validation_status, external_heartbeat_checked_at')
      .limit(1);

    if (columnError) {
      console.error('Column check failed:', {
        message: columnError.message,
        details: columnError.details,
        hint: columnError.hint,
        code: columnError.code,
      });

      // If specific columns don't exist, the migrations haven't been deployed
      if (columnError.message.includes('column') || columnError.code === '42703') {
        throw new Error(
          'Email validation columns not found. Please deploy migrations:\n' +
          '  npx supabase db push\n' +
          'Required migrations:\n' +
          '  - 20250109152531_email_jsonb.sql\n' +
          '  - 20251226100000_add_contact_heartbeats.sql'
        );
      }

      throw new Error(`Column validation failed: ${columnError.message || 'Unknown error'}`);
    }

    console.log('✅ Email validation columns exist');

    // Parse configuration from query params and body
    const url = new URL(req.url);
    const iteration = parseInt(url.searchParams.get('iteration') || '0');
    
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const config: ValidationConfig = {
      ...DEFAULT_CONFIG,
      ...body.config,
    };

    console.log(`
=== Validation Iteration ${iteration} ===`);
    console.log('Config:', config);

    // 1. Check queue size FIRST
    const queueSize = await getValidationQueueSize(config);
    console.log(`Queue size: ${queueSize} contacts need validation`);

    // 2. Manage Session (Prevent concurrent loops)
    if (iteration === 0) {
      if (queueSize === 0) {
        console.log('✅ No contacts need validation, skipping session creation');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'All contacts validated',
            iteration,
            queueSize: 0,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Try to start new session
      const { data: newSessionId, error: sessionError } = await supabaseAdmin
        .rpc('start_validation_session', {
          p_total_contacts: queueSize,
          p_config: config
        });

      if (sessionError) {
        // Check if it's exclusion violation (another session running)
        if (sessionError.code === '23P01' || sessionError.message?.includes('already running')) {
          console.warn('⚠️ Another validation loop is already running');
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Another validation loop is already running',
              iteration,
              skipped: true,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
          );
        }
        throw sessionError;
      }

      sessionId = newSessionId;
      console.log(`✅ Validation session created: ${sessionId}`);
    } else {
      // Continuation iteration - get session ID from query param
      sessionId = url.searchParams.get('session_id') || '';
      if (!sessionId) {
        throw new Error('Session ID required for iteration > 0');
      }
      console.log(`🔄 Continuing session: ${sessionId} (iteration ${iteration})`);
    }

    // Safety check: prevent infinite loops
    if (iteration >= config.maxIterations) {
      const msg = `Reached max iterations (${config.maxIterations}), stopping loop`;
      console.warn(`⚠️ ${msg}`);
      if (sessionId) await completeSession(sessionId, 'failed', msg);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Max iterations reached',
          iteration,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check queue again (for iteration > 0)
    if (queueSize === 0) {
      console.log('✅ No contacts need validation, exiting loop');
      if (sessionId) await completeSession(sessionId, 'completed', 'All contacts validated');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All contacts validated',
          iteration,
          queueSize: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch batch with priority (recent activity first)
    const staleDate = new Date(Date.now() - config.daysStale * 86400000).toISOString();

    const { data: contacts, error: fetchError } = await supabaseAdmin
      .from('contacts')
      .select('id, email_jsonb, last_seen')
      .not('email_jsonb', 'is', null)
      .neq('email_jsonb', '[]')
      .or(`email_validation_status.is.null,external_heartbeat_checked_at.lt.${staleDate}`)
      .order('last_seen', { ascending: false, nullsFirst: false }) // Active contacts first
      .limit(config.batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch contacts: ${fetchError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      console.log('No contacts found in this batch, exiting');
      if (sessionId) await completeSession(sessionId, 'completed', 'Batch empty');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Batch complete',
          iteration,
          validated: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${contacts.length} contacts (${queueSize - contacts.length} remaining)`);

    // 4. Validate emails with throttling
    // Extract primary (first) email from email_jsonb array
    const results: EmailValidationResult[] = [];
    for (const contact of contacts) {
      if (!contact.email_jsonb || !Array.isArray(contact.email_jsonb) || contact.email_jsonb.length === 0) {
        continue;
      }

      // Get the first email address from the array
      const primaryEmail = contact.email_jsonb[0]?.email;
      if (!primaryEmail) continue;

      const result = await validateEmail(primaryEmail);
      results.push(result);

      // Throttle between emails
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenEmails));
    }

    // 5. Fetch current validation status (to detect changes)
    const contactsWithStatus = await Promise.all(
      contacts.map(async (contact) => {
        const { data } = await supabaseAdmin
          .from('contacts')
          .select('id, email_validation_status')
          .eq('id', contact.id)
          .single();
        return { ...contact, current_status: data?.email_validation_status };
      })
    );

    // 6. Update database
    const updates = contactsWithStatus.map((contact, index) => {
      const result = results[index];
      return supabaseAdmin
        .from('contacts')
        .update({
          email_validation_status: result.status,
          external_heartbeat_status: result.status === 'valid' ? 'valid' :
                                     result.status === 'invalid' ? 'invalid' : 'risky',
          external_heartbeat_checked_at: new Date().toISOString(),
        })
        .eq('id', contact.id);
    });

    await Promise.all(updates);

    // 7. Create contact notes for status changes
    const notesToCreate = contactsWithStatus
      .map((contact, index) => {
        const result = results[index];
        const oldStatus = contact.current_status;
        const newStatus = result.status;

        if (oldStatus === newStatus) return null;

        let emoji = '📧';
        let text = '';

        if (!oldStatus) {
          emoji = '✨';
          text = `Email validation completed: ${newStatus}`;
          if (result.reason) text += ` (${result.reason})`;
        } else if (newStatus === 'valid' && oldStatus !== 'valid') {
          emoji = '✅';
          text = `Email validation improved: ${oldStatus} → ${newStatus}`;
        } else if (newStatus === 'invalid') {
          emoji = '❌';
          text = `Email validation failed: ${oldStatus} → ${newStatus}`;
          if (result.reason) text += ` - ${result.reason}`;
        } else if (newStatus === 'risky') {
          emoji = '⚠️';
          text = `Email validation warning: ${oldStatus} → ${newStatus}`;
          if (result.reason) text += ` - ${result.reason}`;
        } else {
          text = `Email validation status changed: ${oldStatus} → ${newStatus}`;
          if (result.reason) text += ` (${result.reason})`;
        }

        return {
          contact_id: contact.id,
          text: `${emoji} ${text}`,
          date: new Date().toISOString(),
          sales_id: null, // System-generated note
          status: 'cold',
        };
      })
      .filter(note => note !== null);

    if (notesToCreate.length > 0) {
      const { error: notesError } = await supabaseAdmin
        .from('contactNotes')
        .insert(notesToCreate);

      if (notesError) {
        console.error('Failed to create contact notes:', notesError);
      } else {
        console.log(`Created ${notesToCreate.length} contact notes for status changes`);
      }
    }

    const summary = {
      valid: results.filter(r => r.status === 'valid').length,
      risky: results.filter(r => r.status === 'risky').length,
      invalid: results.filter(r => r.status === 'invalid').length,
      unknown: results.filter(r => r.status === 'unknown').length,
      statusChanges: notesToCreate.length,
      notesCreated: notesToCreate.length,
    };

    const elapsed = Date.now() - startTime;
    console.log(`Batch complete: ${JSON.stringify(summary)} (${elapsed}ms)`);

    // 8. Update session progress
    if (sessionId) {
      await updateSession(sessionId, contacts.length, iteration);
    }

    // 9. Decide: continue or stop?
    const remaining = queueSize - contacts.length;

    if (remaining > 0) {
      console.log(`📊 Progress: ${contacts.length}/${queueSize} (${Math.round(contacts.length/queueSize*100)}%)`);
      console.log(`🔄 Triggering next batch for ${remaining} remaining contacts...`);

      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && serviceKey && sessionId) {
        triggerNextBatch(iteration, sessionId, config, supabaseUrl, serviceKey);
      } else {
        console.warn('⚠️ Missing URL/Key or SessionID, cannot self-trigger');
        if (sessionId) await completeSession(sessionId, 'failed', 'Self-trigger failed: missing config');
      }
    } else {
      console.log('✅ All contacts validated!');
      if (sessionId) await completeSession(sessionId, 'completed', 'All contacts validated');

      // SELF-ADAPTIVE: Check if new work arrived
      const newQueueSize = await getValidationQueueSize(config);

      if (newQueueSize > 0) {
        console.log(`🔄 Found ${newQueueSize} new contacts needing validation`);
        console.log('🚀 Starting new validation cycle immediately (self-adaptive mode)');

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && serviceKey) {
          // Wait a bit before starting new cycle
          await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute pause
          
          // NOTE: Triggering iteration -1 (which becomes 0) to start NEW session
          // We pass 'undefined' for sessionId because iteration 0 will create a new one
          const url = `${supabaseUrl}/functions/v1/validate-contact-emails?iteration=0`;
           await fetch(url, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ config }),
           }).catch(err => console.error('Failed to trigger next cycle:', err));
        }
      } else {
        console.log('💤 No new work, entering idle state until next cron');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        iteration,
        validated: contacts.length,
        remaining,
        queueSize,
        summary,
        elapsed,
        willContinue: remaining > 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    if (sessionId) await completeSession(sessionId, 'failed', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});