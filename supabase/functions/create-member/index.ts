import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authorization = req.headers.get("Authorization");

    if (!authorization) return json({ error: "Authentication required" }, 401);

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid authentication" }, 401);

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: adminProfile, error: adminError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (adminError || adminProfile?.role !== "admin") {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const birthday = body.birthday || null;
    const password = String(body.password || "");

    if (!name || !username || !password) {
      return json({ error: "name, username and password are required" }, 400);
    }
    if (password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

    const { data: existing } = await adminClient
      .from("profiles")
      .select("id, auth_user_id")
      .eq("username", username)
      .maybeSingle();

    if (!existing) return json({ error: "Create the member's profile row first" }, 400);
    if (existing.auth_user_id) return json({ error: "This member already has an account" }, 409);

    const email = `${username}@zarkora.app`;

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return json({ error: createError?.message || "Could not create account" }, 400);
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .update({
        auth_user_id: created.user.id,
        name,
        username,
        birthday,
        role: "member",
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: "Auth created but profile linking failed", details: profileError.message }, 500);
    }

    return json({ success: true, message: "Member account created successfully", profile });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
