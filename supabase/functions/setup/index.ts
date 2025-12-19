import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

async function createFirstUser(req: Request) {
  const { email, password, first_name, last_name } = await req.json();

  // Check if any users exist
  const { count } = await supabaseAdmin
    .from("sales")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    return createErrorResponse(403, "First user already exists");
  }

  // Create user with admin API (bypasses signup restrictions)
  const { data, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm first user
    user_metadata: { first_name, last_name },
  });

  if (!data?.user || userError) {
    console.error("Error creating first user:", userError);
    return createErrorResponse(500, "Failed to create first user");
  }

  // The database trigger will create the sales record and set administrator = true for first user

  return new Response(
    JSON.stringify({
      data: {
        id: data.user.id,
        email: data.user.email,
      },
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method === "POST") {
    return createFirstUser(req);
  }

  return createErrorResponse(405, "Method Not Allowed");
});
