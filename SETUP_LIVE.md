# NeedFinder Global V5 — Live Starter

## GitHub
1. Create a GitHub repository.
2. Upload the complete contents of this ZIP.
3. Use the `main` branch.
4. In GitHub: Settings → Pages → Source: GitHub Actions.
5. Push to `main`; the included workflow publishes `frontend/`.

## Supabase
1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Run `supabase/rls.sql`.
5. Copy the public Project URL and anon key into `frontend/config.js`.

Never put the Supabase service-role key in `frontend/config.js`.

## Current live-starter behavior
The UI is ready for global marketplace browsing and requirement/offer entry. The Supabase tables and security baseline are prepared for the next integration step.

## Next integration
Connect the browser UI to Supabase Auth + database queries, then add customer/provider dashboards, provider matching, messaging, moderation and payments.
