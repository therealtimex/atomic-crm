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
      "/v1/deals",
      req.method,
      429,
      Date.now() - startTime,
      req
    );
    return rateLimitError;
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const dealId = pathParts[1];

    let response: Response;

    if (req.method === "GET" && dealId) {
      response = await getDeal(apiKey, dealId);
    } else if (req.method === "POST") {
      response = await createDeal(apiKey, req);
    } else if (req.method === "PATCH" && dealId) {
      response = await updateDeal(apiKey, dealId, req);
    } else if (req.method === "DELETE" && dealId) {
      response = await deleteDeal(apiKey, dealId);
    } else {
      response = createErrorResponse(404, "Not found");
    }

    const responseTime = Date.now() - startTime;
    await logApiRequest(
      apiKey.id,
      url.pathname,
      req.method,
      response.status,
      responseTime,
      req
    );

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      apiKey.id,
      new URL(req.url).pathname,
      req.method,
      500,
      responseTime,
      req,
      error.message
    );
    return createErrorResponse(500, "Internal server error");
  }
});

async function getDeal(apiKey: any, dealId: string) {
  if (!hasScope(apiKey, "deals:read")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .single();

  if (error || !data) {
    return createErrorResponse(404, "Deal not found");
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function createDeal(apiKey: any, req: Request) {
  if (!hasScope(apiKey, "deals:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("deals")
    .insert({
      ...body,
      sales_id: apiKey.sales_id,
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse(400, error.message);
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function updateDeal(apiKey: any, dealId: string, req: Request) {
  if (!hasScope(apiKey, "deals:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("deals")
    .update(body)
    .eq("id", dealId)
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse(404, "Deal not found");
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function deleteDeal(apiKey: any, dealId: string) {
  if (!hasScope(apiKey, "deals:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const { error } = await supabaseAdmin
    .from("deals")
    .delete()
    .eq("id", dealId);

  if (error) {
    return createErrorResponse(404, "Deal not found");
  }

  return new Response(null, { status: 204, headers: corsHeaders });
}
