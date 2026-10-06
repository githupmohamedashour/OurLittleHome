import { NextResponse } from "next/server"; import { createClient } from "@supabase/supabase-js"; import { serverClient } from "@/lib/supabaseServer";
// Username -> email lookup happens only here, on the server. The browser never sees the internal email.
export async function POST(req: Request) {
  const fail = async () => { await new Promise(r => setTimeout(r, 700)); return NextResponse.json({ ok: false }, { status: 401 }); };
  const body = await req.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string" || body.username.length > 40 || body.password.length > 200) return fail();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return fail();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: email } = await admin.rpc("get_login_email", { p_username: body.username.trim() });
  if (!email) return fail();
  const sb = await serverClient();
  const { error } = await sb.auth.signInWithPassword({ email, password: body.password });
  return error ? fail() : NextResponse.json({ ok: true });
}
