# ZARKORA

Premium private class journey app, powered by React + Supabase.

## Run

```bash
npm install
npm run dev
```

## Environment

`.env` contains the public Supabase URL and publishable key.

Do **not** put a Supabase service-role key in the Vite frontend.

## One-time Supabase setup

1. Open Supabase SQL Editor.
2. Run `supabase/rls_fix.sql`, then `supabase/payments_flow.sql` (blocks members from self-marking paid, one payment per member per month).
3. Keep the deployed `create-member` Edge Function protected by its custom admin check.
4. In the Edge Function settings, keep **Verify JWT with legacy secret OFF**.
5. Deploy/update `supabase/functions/create-member/index.ts` if you want the source in this project to match the deployed function.

## Login

The ZARKORA UI uses usernames.

- Admin username: `abhinav`
- Admin email is configured by `VITE_ADMIN_EMAIL`.
- Member accounts created by the Edge Function use `<username>@zarkora.app` internally for Supabase Auth.

Passwords are never stored in `profiles`.

## Member creation

The Admin → Members → Add Member flow calls the `create-member` Edge Function. The function verifies the caller's JWT and checks `profiles.role = 'admin'` before creating the Auth account.

## Important

The frontend uses only the Supabase publishable key. The service-role key belongs only in Supabase's server-side Edge Function environment.
