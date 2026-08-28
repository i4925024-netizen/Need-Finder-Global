# NeedFinder Global — Production roadmap status

V7 adds the core production data model for:
- Provider profiles and verification status
- Conversations and messages
- Orders and commission-ready amounts
- User reports/moderation
- Listing search indexes and matching RPC
- Customer/provider dashboard
- GitHub Pages deployment foundation

Still account-dependent:
- Supabase project credentials
- Payment processor merchant account
- Email/SMS/WhatsApp provider accounts
- Domain/hosting account

Those credentials must be owned/configured by the service operator. Never put private service keys in frontend code.
