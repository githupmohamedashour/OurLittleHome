// Run once, locally: npx tsx scripts/seed.ts
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell. NEVER put the
// service-role key in the frontend or in NEXT_PUBLIC_* variables.
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  { username: "Mohamed", email: "mohamed@ourlittleworld.app", password: "Mohamed@2026" },
  { username: "Manar", email: "manar@ourlittleworld.app", password: "Manar@2026" },
];

async function main() {
  const ids: Record<string, string> = {};
  for (const a of accounts) {
    const { data, error } = await admin.auth.admin.createUser({
      email: a.email,
      password: a.password,
      email_confirm: true,
      user_metadata: { username: a.username },
    });
    if (error) throw error; // third account is rejected by the DB trigger
    ids[a.username] = data.user.id;
  }

  if (!process.argv.includes("--demo")) { console.log("Seeded the two accounts (no demo content). Add --demo for sample entries."); return; }
  const by = ids.Mohamed;
  const demo = { is_demo: true, created_by: by };
  await admin.from("timeline_items").insert([
    { ...demo, item_date: "2026-01-01", title: "The beginning of our story", description: "Demo entry. Delete or edit me." },
  ]);
  await admin.from("memories").insert([
    { ...demo, title: "A day worth remembering", memory_date: "2026-01-01", description: "Demo entry. Replace with a real memory.", tags: ["demo"] },
  ]);
  await admin.from("open_when").insert([
    { ...demo, title: "Open when you need a smile", message: "Demo message. Write your own." },
  ]);
  await admin.from("future_plans").insert([
    { ...demo, title: "Places we want to visit", description: "Demo entry.", category: "Travel", status: "idea" },
  ]);
  await admin.from("little_things").insert([
    { ...demo, title: "Something I'm grateful for", description: "Demo entry.", category: "Appreciation" },
  ]);
  console.log("Seeded accounts and demo content.");
}
main().catch((e) => { console.error(e); process.exit(1); });
