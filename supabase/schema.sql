-- Run once in the Supabase SQL editor before using the app.
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  color text not null default '#ed7669' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);
create index habits_user_id on public.habits(user_id);
create table public.completions (
  habit_id uuid not null references public.habits(id) on delete cascade,
  day date not null check (day <= (now() at time zone 'Europe/Berlin')::date),
  primary key (habit_id, day)
);
create table public.reminder_deliveries (
  day date primary key,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.habits enable row level security;
alter table public.completions enable row level security;
alter table public.reminder_deliveries enable row level security;
revoke all on public.habits, public.completions, public.reminder_deliveries from anon, authenticated;
grant select, insert, update, delete on public.habits, public.completions to authenticated;
grant all on public.habits, public.completions, public.reminder_deliveries to service_role;
create policy "Personal habits only" on public.habits for all to authenticated
  using (user_id = (select auth.uid()) and (select auth.jwt()->>'email') = 'robin04102003@gmail.com')
  with check (user_id = (select auth.uid()) and (select auth.jwt()->>'email') = 'robin04102003@gmail.com');
create policy "Personal check-ins only" on public.completions for all to authenticated
  using (exists (select 1 from public.habits where id = habit_id))
  with check (exists (select 1 from public.habits where id = habit_id));
-- No browser access to delivery records. Only the Actions service role uses them.
