-- ZARKORA payment flow hardening. Run once in the Supabase SQL Editor (after rls_fix.sql).

-- 1. "Members can create their own payments" had NO status check, so a member could insert a row
--    with status = 'paid'. Permissive policies are OR-ed, so it must be dropped, not just supplemented.
drop policy if exists "Members can create their own payments" on public.payments;
drop policy if exists "Users can submit own payment request" on public.payments;

-- 2. Members may only insert their OWN payment, as pending, with no verification fields.
--    (No UPDATE/DELETE policy exists for members, so they cannot change status, verified_by, verified_at or other users' rows.
--     Admins keep full access through "Admins can manage payments".)
create policy "Users can submit own payment request"
on public.payments for insert to authenticated
with check (
  user_id in (select id from public.profiles where auth_user_id = auth.uid())
  and status = 'pending'
  and method in ('UPI', 'Cash')
  and paid_at is null and verified_at is null and verified_by is null
);

-- 3. One payment per member per month. If this fails, you have duplicate rows: delete/merge them first, then re-run.
create unique index if not exists payments_user_month_year_uidx
on public.payments (user_id, month, year);
