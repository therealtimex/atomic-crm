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

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Validate API key
  const authResult = await validateApiKey(req);
  if ("status" in authResult) {
    return authResult; // Error response
  }
  const { apiKey } = authResult;

  // Check rate limit
  const rateLimitError = checkRateLimit(apiKey.id);
  if (rateLimitError) {
    await logApiRequest(
      apiKey.id,
      "/v1/contacts",
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
    // pathParts: ["api-v1-contacts", "{id}"]
    const contactId = pathParts[1];

    let response: Response;

    if (req.method === "GET" && contactId) {
      response = await getContact(apiKey, contactId);
    } else if (req.method === "POST") {
      response = await createContact(apiKey, req);
    } else if (req.method === "PATCH" && contactId) {
      response = await updateContact(apiKey, contactId, req);
    } else if (req.method === "DELETE" && contactId) {
      response = await deleteContact(apiKey, contactId);
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

async function getContact(apiKey: any, contactId: string) {
  if (!hasScope(apiKey, "contacts:read")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const id = parseInt(contactId, 10);
  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return createErrorResponse(404, "Contact not found");
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function createContact(apiKey: any, req: Request) {
  if (!hasScope(apiKey, "contacts:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .insert({
      ...body,
      sales_id: apiKey.sales_id, // Associate with API key owner
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

async function updateContact(apiKey: any, contactId: string, req: Request) {
  if (!hasScope(apiKey, "contacts:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .update(body)
    .eq("id", parseInt(contactId, 10))
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse(404, "Contact not found");
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function deleteContact(apiKey: any, contactId: string) {
  if (!hasScope(apiKey, "contacts:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const { error } = await supabaseAdmin
    .from("contacts")
    .delete()
    .eq("id", parseInt(contactId, 10));

  if (error) {
    return createErrorResponse(404, "Contact not found");
  }

  return new Response(null, { status: 204, headers: corsHeaders });
}
