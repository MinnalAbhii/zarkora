-- ZARKORA production RLS alignment
-- Run this once in Supabase SQL Editor after the tables are already created.

create unique index if not exists profiles_username_uidx
on public.profiles (lower(username));

create unique index if not exists profiles_auth_user_id_uidx
on public.profiles (auth_user_id)
where auth_user_id is not null;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Profiles: everyone authenticated can read; only admins can modify.
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;

create policy "Authenticated users can view profiles"
on public.profiles for select to authenticated
using (true);

create policy "Admins can manage profiles"
on public.profiles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Payments: authenticated members can see monthly payment status;
-- only the owner can create a payment; only admins can change/delete payments.
drop policy if exists "Users can view their own payments" on public.payments;
drop policy if exists "Admins can manage payments" on public.payments;
drop policy if exists "Members can create their own payments" on public.payments;

create policy "Authenticated users can view payment status"
on public.payments for select to authenticated
using (true);

create policy "Admins can manage payments"
on public.payments for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Shared read / admin write tables.
drop policy if exists "Authenticated users can view expenses" on public.expenses;
drop policy if exists "Admins can manage expenses" on public.expenses;
create policy "Authenticated users can view expenses"
on public.expenses for select to authenticated using (true);
create policy "Admins can manage expenses"
on public.expenses for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users can view announcements" on public.announcements;
drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Authenticated users can view announcements"
on public.announcements for select to authenticated using (true);
create policy "Admins can manage announcements"
on public.announcements for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users can view fund settings" on public.fund_settings;
drop policy if exists "Admins can manage fund settings" on public.fund_settings;
create policy "Authenticated users can view fund settings"
on public.fund_settings for select to authenticated using (true);
create policy "Admins can manage fund settings"
on public.fund_settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users can view fund goals" on public.fund_goals;
drop policy if exists "Admins can manage fund goals" on public.fund_goals;
create policy "Authenticated users can view fund goals"
on public.fund_goals for select to authenticated using (true);
create policy "Admins can manage fund goals"
on public.fund_goals for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Keep only one default settings row if the table is currently empty.
insert into public.fund_settings (monthly_amount, fund_name, journey_start, journey_end)
select 20, 'Class Fund', '2026-09-01', '2031-07-31'
where not exists (select 1 from public.fund_settings);

-- Members can submit their own payment request (UPI or Cash).
-- They cannot mark it paid; only an admin can verify/mark paid.
drop policy if exists "Users can submit own payment request" on public.payments;
create policy "Users can submit own payment request"
on public.payments
for insert
to authenticated
with check (
  user_id in (
    select id from public.profiles where auth_user_id = auth.uid()
  )
  and status = 'pending'
  and method in ('UPI', 'GPay', 'Cash')
);
