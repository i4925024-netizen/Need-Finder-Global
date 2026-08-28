# Final deployment checklist

1. Create an empty GitHub repository.
2. Upload the contents of this package to the repository root.
3. Commit to `main`.
4. GitHub → Settings → Pages → Source: **GitHub Actions**.
5. The included `.github/workflows/deploy-pages.yml` publishes `frontend/`.
6. Create a Supabase project.
7. Run `supabase/schema.sql`, then `supabase/seed.sql`, then `supabase/rls.sql`, then `supabase/production.sql`.
8. Put only the Supabase **Project URL** and **public anon key** into `frontend/config.js`.
9. Never put the Supabase service-role/secret key into the frontend.
10. Push again. The marketplace can then use real approved listings and customer requirement submission.

For production payments, identity verification, automated matching, email/SMS/WhatsApp notifications, and provider moderation, use server-side/edge functions rather than exposing secrets in the browser.
