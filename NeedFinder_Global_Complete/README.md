# NeedFinder Global - Complete Frontend

This version keeps the working marketplace-style interface from the MVP and adds:

- Search and country filtering
- Category browsing
- Local demo/provider listings using localStorage
- Login / Sign Up / Logout through Supabase Auth
- Customer requirement form
- Supabase requirement search
- `user_id` ownership when posting requirements
- Responsive mobile layout
- GitHub Pages deployment workflow using `frontend/`

## Important

Copy your real Supabase URL and anon/public key into:

`frontend/config.js`

Never put a Supabase `service_role` key in browser code.

The online requirement features expect a Supabase `requirements` table containing at least:

- `id`
- `user_id`
- `title`
- `category`
- `location`
- `details`
- `status`
- `created_at`

The GitHub Actions workflow deploys `./frontend`.

If Supabase is not configured yet, the local marketplace demo still loads, but online authentication and requirements are disabled.
