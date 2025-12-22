/**
 * Edge Function: process-large-payloads
 *
 * Processes activities with large payloads and moves them to Supabase Storage.
 * This function runs periodically (via cron or manual trigger) to:
 * 1. Find activities with payload_storage_status = 'pending_move'
 * 2. Upload their raw_data to Supabase Storage
 * 3. Update the activity record to reference the storage location
 *
 * This prevents table bloat and improves query performance.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Activity {
  id: number;
  raw_data: unknown;
  payload_size_bytes: number;
  provider: string;
}

interface ProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  errors: Array<{ activity_id: number; error: string }>;
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get optional parameters from request
    const { limit = 10, max_age_minutes = 5 } = await req.json().catch(() => ({}));

    console.log(`Processing large payloads (limit: ${limit}, max_age: ${max_age_minutes}min)`);

    // Find activities with large payloads pending storage migration
    const { data: activities, error: fetchError } = await supabase
      .from('activities')
      .select('id, raw_data, payload_size_bytes, provider')
      .eq('payload_storage_status', 'pending_move')
      .lt('created_at', new Date(Date.now() - max_age_minutes * 60 * 1000).toISOString())
      .limit(limit)
      .returns<Activity[]>();

    if (fetchError) {
      console.error('Error fetching activities:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities', details: fetchError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!activities || activities.length === 0) {
      console.log('No activities pending storage migration');
      return new Response(
        JSON.stringify({ message: 'No activities to process', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${activities.length} activities to process`);

    const result: ProcessResult = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    // Process each activity
    for (const activity of activities) {
      try {
        await processActivity(supabase, activity, result);
      } catch (error) {
        console.error(`Failed to process activity ${activity.id}:`, error);
        result.failed++;
        result.errors.push({
          activity_id: activity.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Processing complete:', result);

    return new Response(
      JSON.stringify({
        message: 'Processing complete',
        ...result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function processActivity(
  supabase: any,
  activity: Activity,
  result: ProcessResult
): Promise<void> {
  const { id, raw_data, provider } = activity;

  // Generate storage path: {activity_id}/{timestamp}.json
  const timestamp = Date.now();
  const storagePath = `${id}/${timestamp}.json`;

  console.log(`Processing activity ${id} (${activity.payload_size_bytes} bytes) -> ${storagePath}`);

  // Convert payload to JSON string for storage
  const payloadJson = JSON.stringify(raw_data, null, 2);
  const payloadBlob = new Blob([payloadJson], { type: 'application/json' });

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('activity-payloads')
    .upload(storagePath, payloadBlob, {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadError) {
    console.error(`Failed to upload activity ${id}:`, uploadError);
    result.failed++;
    result.errors.push({
      activity_id: id,
      error: `Storage upload failed: ${uploadError.message}`,
    });
    return;
  }

  console.log(`Uploaded activity ${id} to storage: ${storagePath}`);

  // Call the database function to update the activity record
  const { data: moveResult, error: moveError } = await supabase
    .rpc('move_payload_to_storage', {
      p_activity_id: id,
      p_storage_path: storagePath,
    });

  if (moveError) {
    console.error(`Failed to update activity ${id}:`, moveError);

    // Try to clean up uploaded file
    await supabase.storage.from('activity-payloads').remove([storagePath]);

    result.failed++;
    result.errors.push({
      activity_id: id,
      error: `Database update failed: ${moveError.message}`,
    });
    return;
  }

  console.log(`Successfully processed activity ${id}`);
  result.processed++;
}
