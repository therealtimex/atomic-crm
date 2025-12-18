// RealTimeX CRM - Update Password Edge Function
// This function handles password reset requests for CRM users
//
// To deploy:
// 1. Go to Supabase Dashboard → Edge Functions
// 2. Click "Deploy a new function"
// 3. Name it: updatePassword
// 4. Copy and paste this entire file
// 5. Click "Deploy"

import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS headers for API access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, PATCH, DELETE",
};

function createErrorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ status, message }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status,
  });
}

// Initialize Supabase Admin client (uses service_role key automatically)
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function updatePassword(user: any) {
  const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
    user.email
  );

  if (!data || error) {
    return createErrorResponse(500, "Internal Server Error");
  }

  return new Response(
    JSON.stringify({
      data,
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization")!;
  const localClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data } = await localClient.auth.getUser();
  if (!data?.user) {
    return createErrorResponse(401, "Unauthorized");
  }

  if (req.method === "PATCH") {
    return updatePassword(data.user);
  }

  return createErrorResponse(405, "Method Not Allowed");
});
