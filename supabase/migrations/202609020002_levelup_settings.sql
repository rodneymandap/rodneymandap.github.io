-- Level Up runtime settings for UI-managed model overrides.

create table if not exists public.levelup_settings (
  key text primary key check (char_length(key) between 1 and 64),
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists levelup_settings_set_updated_at on public.levelup_settings;
create trigger levelup_settings_set_updated_at
before update on public.levelup_settings
for each row execute function levelup_private.set_updated_at();

alter table public.levelup_settings enable row level security;

drop policy if exists levelup_settings_select_own on public.levelup_settings;
create policy levelup_settings_select_own on public.levelup_settings
for select to authenticated
using (levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_settings_insert_own on public.levelup_settings;
create policy levelup_settings_insert_own on public.levelup_settings
for insert to authenticated
with check (levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_settings_update_own on public.levelup_settings;
create policy levelup_settings_update_own on public.levelup_settings
for update to authenticated
using (levelup_private.is_allowed((select auth.uid())))
with check (levelup_private.is_allowed((select auth.uid())));

revoke all on public.levelup_settings from public, anon, authenticated;
grant select, insert, update on public.levelup_settings to authenticated;

