# Our Little World
1. Supabase: create a project, Auth -> disable public signups.
2. SQL editor: fresh install = run supabase/schema.sql (it already includes everything). Existing install = run supabase/003_update.sql.
3. Seed accounts locally: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed.ts   (add --demo for sample content; remove it later from Account -> Remove demo content)
4. Env vars (.env.local and Vercel): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only; never prefix with NEXT_PUBLIC).
5. npm install && npm run dev. Deploy on Vercel with the same three variables.
Maps: Places uses OpenStreetMap embeds. No API key, nothing to configure. Enter latitude/longitude on a place to show the map.
Change both initial passwords after first login.
