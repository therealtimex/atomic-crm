import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";
import {
  validateApiKey,
  checkRateLimit,
  hasScope,
  logApiRequest,
} from "../_shared/apiKeyAuth.ts";

Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authResult = await validateApiKey(req);
  if ("status" in authResult) {
    return authResult;
  }
  const { apiKey } = authResult;

  const rateLimitError = checkRateLimit(apiKey.id);
  if (rateLimitError) {
    await logApiRequest(
      apiKey.id,
      "/v1/activities",
      req.method,
      429,
      Date.now() - startTime,
      req
    );
    return rateLimitError;
  }

  try {
    if (req.method === "POST") {
      const response = await createActivity(apiKey, req);
      const responseTime = Date.now() - startTime;
      await logApiRequest(
        apiKey.id,
        "/v1/activities",
        req.method,
        response.status,
        responseTime,
        req
      );
      return response;
    } else {
      return createErrorResponse(404, "Not found");
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      apiKey.id,
      "/v1/activities",
      req.method,
      500,
      responseTime,
      req,
      error.message
    );
    return createErrorResponse(500, "Internal server error");
  }
});

async function createActivity(apiKey: any, req: Request) {
  if (!hasScope(apiKey, "activities:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const body = await req.json();
  const { type, ...activityData } = body;

  // Activities can be notes or tasks
  if (type === "note" || type === "contact_note") {
    const { data, error } = await supabaseAdmin
      .from("contactNotes")
      .insert({
        ...activityData,
        sales_id: apiKey.sales_id,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse(400, error.message);
    }

    return new Response(JSON.stringify({ data, type: "note" }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else if (type === "task") {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        ...activityData,
        sales_id: apiKey.sales_id,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse(400, error.message);
    }

    return new Response(JSON.stringify({ data, type: "task" }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else if (type === "deal_note") {
    const { data, error } = await supabaseAdmin
      .from("dealNotes")
      .insert({
        ...activityData,
        sales_id: apiKey.sales_id,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse(400, error.message);
    }

    return new Response(JSON.stringify({ data, type: "deal_note" }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    return createErrorResponse(
      400,
      "Invalid activity type. Must be 'note', 'contact_note', 'task', or 'deal_note'"
    );
  }
}
