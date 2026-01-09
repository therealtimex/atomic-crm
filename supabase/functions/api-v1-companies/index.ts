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
      "/v1/companies",
      req.method,
      429,
      Date.now() - startTime,
      req,
    );
    return rateLimitError;
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const companyId = pathParts[1];

    let response: Response;

    if (req.method === "GET") {
      if (companyId) {
        response = await getCompany(apiKey, companyId);
      } else {
        response = await listCompanies(apiKey, req);
      }
    } else if (req.method === "POST") {
      response = await createCompany(apiKey, req);
    } else if (req.method === "PATCH" && companyId) {
      response = await updateCompany(apiKey, companyId, req);
    } else if (req.method === "DELETE" && companyId) {
      response = await deleteCompany(apiKey, companyId);
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
      req,
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
      error.message,
    );
    return createErrorResponse(500, "Internal server error");
  }
});

async function listCompanies(apiKey: any, req: Request) {
  if (!hasScope(apiKey, "companies:read")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const website = url.searchParams.get("website");
  const domain = url.searchParams.get("domain"); // Alias for website

  let query = supabaseAdmin.from("companies").select("*");

  if (name) {
    query = query.ilike("name", `%${name}%`);
  }

  if (website || domain) {
    // Exact match for website/domain
    query = query.eq("website", website || domain);
  }

  if (!name && !website && !domain) {
    query = query.limit(50);
  }

  const { data, error } = await query;

  if (error) {
    return createErrorResponse(500, error.message);
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function getCompany(apiKey: any, companyId: string) {
  if (!hasScope(apiKey, "companies:read")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error || !data) {
    return createErrorResponse(404, "Company not found");
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function createCompany(apiKey: any, req: Request) {
  if (!hasScope(apiKey, "companies:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("companies")
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

async function updateCompany(apiKey: any, companyId: string, req: Request) {
  if (!hasScope(apiKey, "companies:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("companies")
    .update(body)
    .eq("id", companyId)
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse(404, "Company not found");
  }

  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function deleteCompany(apiKey: any, companyId: string) {
  if (!hasScope(apiKey, "companies:write")) {
    return createErrorResponse(403, "Insufficient permissions");
  }

  const { error } = await supabaseAdmin
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (error) {
    return createErrorResponse(404, "Company not found");
  }

  return new Response(null, { status: 204, headers: corsHeaders });
}
