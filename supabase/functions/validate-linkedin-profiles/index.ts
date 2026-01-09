import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders } from "../_shared/utils.ts";

/**
 * Edge Function: Validate LinkedIn Profiles
 *
 * Checks if LinkedIn profile URLs are active/valid.
 * Updates linkedin_profile_status field.
 *
 * Statuses:
 * - 'active': Profile exists and is accessible
 * - 'inactive': Profile exists but may be private/restricted
 * - 'not_found': Profile URL is invalid or deleted
 */

interface LinkedInValidationResult {
  url: string;
  status: "active" | "inactive" | "not_found";
  reason?: string;
}

/**
 * Validate LinkedIn profile URL
 * Uses HEAD request to check if profile is accessible
 */
async function validateLinkedInProfile(
  url: string,
): Promise<LinkedInValidationResult> {
  try {
    // Normalize URL
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    // Basic URL validation
    if (!url.includes("linkedin.com/in/")) {
      return {
        url,
        status: "not_found",
        reason: "Invalid LinkedIn URL format",
      };
    }

    // OPTION 1: Simple HEAD request (basic check, may be blocked by LinkedIn)
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AtomicCRM/1.0)",
      },
    });

    if (response.status === 200) {
      return { url, status: "active", reason: "Profile accessible" };
    } else if (response.status === 403 || response.status === 401) {
      return { url, status: "inactive", reason: "Profile restricted" };
    } else if (response.status === 404) {
      return { url, status: "not_found", reason: "Profile not found" };
    } else {
      return { url, status: "inactive", reason: `HTTP ${response.status}` };
    }

    // OPTION 2: Use third-party API (recommended for production)
    // Example: Proxycurl, RapidAPI LinkedIn endpoints, etc.
    //
    // const apiKey = Deno.env.get('LINKEDIN_API_KEY');
    // const response = await fetch(
    //   `https://api.proxycurl.com/api/linkedin/profile/check?url=${encodeURIComponent(url)}`,
    //   { headers: { 'Authorization': `Bearer ${apiKey}` } }
    // );
  } catch (error) {
    console.error(`LinkedIn validation failed for ${url}:`, error);
    return { url, status: "not_found", reason: "Validation error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get("batch_size") || "50");
    const daysStale = parseInt(url.searchParams.get("days_stale") || "90");

    console.log(
      `Starting LinkedIn validation (batch: ${batchSize}, stale after: ${daysStale} days)`,
    );

    // Find contacts with LinkedIn URLs that need validation
    const { data: contacts, error: fetchError } = await supabaseAdmin
      .from("contacts")
      .select("id, linkedin_url")
      .not("linkedin_url", "is", null)
      .or(
        `linkedin_profile_status.is.null,employment_verified_at.lt.${new Date(Date.now() - daysStale * 86400000).toISOString()}`,
      )
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch contacts: ${fetchError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No LinkedIn profiles need validation",
          validated: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Found ${contacts.length} LinkedIn profiles to validate`);

    // Validate profiles with rate limiting
    const results: LinkedInValidationResult[] = [];
    for (const contact of contacts) {
      if (!contact.linkedin_url) continue;

      const result = await validateLinkedInProfile(contact.linkedin_url);
      results.push(result);

      // Rate limiting: 200ms between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update contacts
    const updates = contacts.map((contact, index) => {
      const result = results[index];
      return supabaseAdmin
        .from("contacts")
        .update({
          linkedin_profile_status: result.status,
          employment_verified_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
    });

    await Promise.all(updates);

    const summary = {
      validated: contacts.length,
      active: results.filter((r) => r.status === "active").length,
      inactive: results.filter((r) => r.status === "inactive").length,
      not_found: results.filter((r) => r.status === "not_found").length,
    };

    console.log("LinkedIn validation complete:", summary);

    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("LinkedIn validation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
