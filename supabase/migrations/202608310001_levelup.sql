-- Level Up personal growth application
-- Apply this migration in the existing Supabase project's SQL editor.
-- No Vercel storage, cron, Realtime, or Supabase Edge Functions are required.

create extension if not exists pgcrypto;
create schema if not exists levelup_private;

revoke all on schema levelup_private from public, anon;
grant usage on schema levelup_private to authenticated;

create table if not exists levelup_private.allowed_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on levelup_private.allowed_users from public, anon, authenticated;

create table if not exists public.levelup_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Asia/Manila' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.levelup_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  cadence text not null check (cadence in ('daily', 'weekly', 'once')),
  difficulty text not null check (difficulty in ('easy', 'normal', 'hard', 'epic')),
  stat_key text not null check (stat_key in ('strength', 'vitality', 'intellect', 'discipline')),
  xp_reward smallint generated always as (
    case difficulty
      when 'easy' then 10
      when 'normal' then 25
      when 'hard' then 50
      when 'epic' then 100
    end
  ) stored,
  active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.levelup_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.levelup_missions(id) on delete restrict,
  recurrence_key text not null check (char_length(recurrence_key) between 4 and 16),
  local_date date not null,
  xp_awarded smallint not null check (xp_awarded in (10, 25, 50, 100)),
  stat_key text not null check (stat_key in ('strength', 'vitality', 'intellect', 'discipline')),
  completed_at timestamptz not null default now(),
  unique (user_id, mission_id, recurrence_key)
);

create table if not exists public.levelup_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp bigint not null default 0 check (total_xp >= 0),
  level integer not null default 1 check (level >= 1),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_active_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.levelup_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  stat_key text not null check (stat_key in ('strength', 'vitality', 'intellect', 'discipline')),
  xp bigint not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, stat_key)
);

create table if not exists public.levelup_achievement_definitions (
  slug text primary key check (char_length(slug) between 1 and 64),
  title text not null check (char_length(title) between 1 and 80),
  description text not null check (char_length(description) between 1 and 180),
  icon_key text not null check (char_length(icon_key) between 1 and 32),
  criteria_type text not null check (criteria_type in ('completion_count', 'streak', 'level', 'stat_xp')),
  threshold integer not null check (threshold > 0),
  stat_key text check (stat_key is null or stat_key in ('strength', 'vitality', 'intellect', 'discipline')),
  sort_order integer not null default 0
);

create table if not exists public.levelup_user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_slug text not null references public.levelup_achievement_definitions(slug) on delete cascade,
  unlocked_at timestamptz not null default now(),
  source_completion_id uuid references public.levelup_completions(id) on delete set null,
  primary key (user_id, achievement_slug)
);

create index if not exists levelup_missions_user_active_idx
  on public.levelup_missions (user_id, active, cadence, created_at desc);
create index if not exists levelup_completions_user_date_idx
  on public.levelup_completions (user_id, local_date desc, completed_at desc);
create index if not exists levelup_completions_mission_idx
  on public.levelup_completions (mission_id, completed_at desc);
create index if not exists levelup_user_achievements_date_idx
  on public.levelup_user_achievements (user_id, unlocked_at desc);

insert into public.levelup_achievement_definitions
  (slug, title, description, icon_key, criteria_type, threshold, stat_key, sort_order)
values
  ('first-step', 'First Step', 'Complete your first mission.', 'spark', 'completion_count', 1, null, 10),
  ('quest-runner-10', 'Quest Runner', 'Complete 10 missions.', 'compass', 'completion_count', 10, null, 20),
  ('quest-hunter-50', 'Quest Hunter', 'Complete 50 missions.', 'target', 'completion_count', 50, null, 30),
  ('centurion-100', 'Centurion', 'Complete 100 missions.', 'crown', 'completion_count', 100, null, 40),
  ('streak-3', 'Momentum', 'Build a 3-day mission streak.', 'flame', 'streak', 3, null, 50),
  ('streak-7', 'Unbroken', 'Build a 7-day mission streak.', 'flame', 'streak', 7, null, 60),
  ('streak-30', 'Relentless', 'Build a 30-day mission streak.', 'flame', 'streak', 30, null, 70),
  ('level-5', 'Awakened', 'Reach Level 5.', 'level', 'level', 5, null, 80),
  ('level-10', 'Ascendant', 'Reach Level 10.', 'level', 'level', 10, null, 90),
  ('strength-250', 'Iron Will', 'Earn 250 Strength XP.', 'strength', 'stat_xp', 250, 'strength', 100),
  ('vitality-250', 'Enduring Core', 'Earn 250 Vitality XP.', 'vitality', 'stat_xp', 250, 'vitality', 110),
  ('intellect-250', 'Clear Mind', 'Earn 250 Intellect XP.', 'intellect', 'stat_xp', 250, 'intellect', 120),
  ('discipline-250', 'Unshaken', 'Earn 250 Discipline XP.', 'discipline', 'stat_xp', 250, 'discipline', 130)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon_key = excluded.icon_key,
  criteria_type = excluded.criteria_type,
  threshold = excluded.threshold,
  stat_key = excluded.stat_key,
  sort_order = excluded.sort_order;

create or replace function levelup_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists levelup_profiles_set_updated_at on public.levelup_profiles;
create trigger levelup_profiles_set_updated_at
before update on public.levelup_profiles
for each row execute function levelup_private.set_updated_at();

drop trigger if exists levelup_missions_set_updated_at on public.levelup_missions;
create trigger levelup_missions_set_updated_at
before update on public.levelup_missions
for each row execute function levelup_private.set_updated_at();

create or replace function levelup_private.is_allowed(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from levelup_private.allowed_users allowed
    where allowed.user_id = p_user_id
  );
$$;

create or replace function levelup_private.ensure_user_state(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or p_user_id <> (select auth.uid()) then
    raise exception 'Level Up authentication required' using errcode = '42501';
  end if;

  if not levelup_private.is_allowed(p_user_id) then
    raise exception 'This account is not authorized for Level Up' using errcode = '42501';
  end if;

  insert into public.levelup_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.levelup_progress (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.levelup_stats (user_id, stat_key)
  values
    (p_user_id, 'strength'),
    (p_user_id, 'vitality'),
    (p_user_id, 'intellect'),
    (p_user_id, 'discipline')
  on conflict (user_id, stat_key) do nothing;
end;
$$;

create or replace function levelup_private.current_local_date(p_user_id uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select timezone(coalesce(
    (select profile.timezone from public.levelup_profiles profile where profile.user_id = p_user_id),
    'Asia/Manila'
  ), now())::date;
$$;

create or replace function levelup_private.recurrence_key(p_cadence text, p_local_date date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_cadence
    when 'daily' then to_char(p_local_date, 'YYYY-MM-DD')
    when 'weekly' then to_char(p_local_date, 'IYYY-"W"IW')
    when 'once' then 'once'
    else null
  end;
$$;

create or replace function levelup_private.recalculate_state(
  p_user_id uuid,
  p_source_completion_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total_xp bigint := 0;
  v_level integer := 1;
  v_completion_count integer := 0;
  v_current_streak integer := 0;
  v_best_streak integer := 0;
  v_latest_streak integer;
  v_latest_streak_end date;
  v_last_active date;
  v_today date;
begin
  perform levelup_private.ensure_user_state(p_user_id);
  perform 1 from public.levelup_progress where user_id = p_user_id for update;

  select coalesce(sum(completion.xp_awarded), 0), count(*)::integer, max(completion.local_date)
  into v_total_xp, v_completion_count, v_last_active
  from public.levelup_completions completion
  where completion.user_id = p_user_id;

  while v_total_xp >= (50::bigint * v_level * (v_level + 1)) loop
    v_level := v_level + 1;
  end loop;

  insert into public.levelup_stats (user_id, stat_key, xp, updated_at)
  select
    p_user_id,
    stat.stat_key,
    coalesce(sum(completion.xp_awarded), 0)::bigint,
    now()
  from (
    values ('strength'::text), ('vitality'::text), ('intellect'::text), ('discipline'::text)
  ) as stat(stat_key)
  left join public.levelup_completions completion
    on completion.user_id = p_user_id and completion.stat_key = stat.stat_key
  group by stat.stat_key
  on conflict (user_id, stat_key) do update set
    xp = excluded.xp,
    updated_at = excluded.updated_at;

  with activity_dates as (
    select distinct completion.local_date
    from public.levelup_completions completion
    where completion.user_id = p_user_id
  ), numbered as (
    select
      local_date,
      local_date - (row_number() over (order by local_date))::integer as streak_group
    from activity_dates
  ), streaks as (
    select
      count(*)::integer as streak_length,
      max(local_date) as streak_end
    from numbered
    group by streak_group
  )
  select coalesce(max(streak_length), 0)
  into v_best_streak
  from streaks;

  with activity_dates as (
    select distinct completion.local_date
    from public.levelup_completions completion
    where completion.user_id = p_user_id
  ), numbered as (
    select
      local_date,
      local_date - (row_number() over (order by local_date))::integer as streak_group
    from activity_dates
  ), streaks as (
    select
      count(*)::integer as streak_length,
      max(local_date) as streak_end
    from numbered
    group by streak_group
  )
  select streak_length, streak_end
  into v_latest_streak, v_latest_streak_end
  from streaks
  order by streak_end desc
  limit 1;

  v_today := levelup_private.current_local_date(p_user_id);
  if v_latest_streak_end is not null and v_latest_streak_end >= (v_today - 1) then
    v_current_streak := v_latest_streak;
  end if;

  update public.levelup_progress
  set
    total_xp = v_total_xp,
    level = v_level,
    current_streak = v_current_streak,
    best_streak = v_best_streak,
    last_active_date = v_last_active,
    updated_at = now()
  where user_id = p_user_id;

  delete from public.levelup_user_achievements earned
  using public.levelup_achievement_definitions definition
  where earned.user_id = p_user_id
    and earned.achievement_slug = definition.slug
    and not (
      (definition.criteria_type = 'completion_count' and v_completion_count >= definition.threshold)
      or (definition.criteria_type = 'streak' and v_best_streak >= definition.threshold)
      or (definition.criteria_type = 'level' and v_level >= definition.threshold)
      or (
        definition.criteria_type = 'stat_xp'
        and coalesce((
          select stat.xp
          from public.levelup_stats stat
          where stat.user_id = p_user_id and stat.stat_key = definition.stat_key
        ), 0) >= definition.threshold
      )
    );

  insert into public.levelup_user_achievements
    (user_id, achievement_slug, unlocked_at, source_completion_id)
  select p_user_id, definition.slug, now(), p_source_completion_id
  from public.levelup_achievement_definitions definition
  where
    (definition.criteria_type = 'completion_count' and v_completion_count >= definition.threshold)
    or (definition.criteria_type = 'streak' and v_best_streak >= definition.threshold)
    or (definition.criteria_type = 'level' and v_level >= definition.threshold)
    or (
      definition.criteria_type = 'stat_xp'
      and coalesce((
        select stat.xp
        from public.levelup_stats stat
        where stat.user_id = p_user_id and stat.stat_key = definition.stat_key
      ), 0) >= definition.threshold
    )
  on conflict (user_id, achievement_slug) do nothing;
end;
$$;

create or replace function levelup_private.dashboard_payload(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date;
  v_progress public.levelup_progress%rowtype;
  v_stats jsonb;
  v_missions jsonb;
  v_current_threshold bigint;
  v_next_level_xp integer;
begin
  if p_user_id is null or p_user_id <> (select auth.uid()) then
    raise exception 'Level Up authentication required' using errcode = '42501';
  end if;

  if not levelup_private.is_allowed(p_user_id) then
    raise exception 'This account is not authorized for Level Up' using errcode = '42501';
  end if;

  v_today := levelup_private.current_local_date(p_user_id);

  select * into v_progress
  from public.levelup_progress
  where user_id = p_user_id;

  v_current_threshold := 50::bigint * (v_progress.level - 1) * v_progress.level;
  v_next_level_xp := 100 * v_progress.level;

  select coalesce(jsonb_agg(
    jsonb_build_object('key', stat.stat_key, 'xp', stat.xp)
    order by case stat.stat_key
      when 'strength' then 1
      when 'vitality' then 2
      when 'intellect' then 3
      else 4
    end
  ), '[]'::jsonb)
  into v_stats
  from public.levelup_stats stat
  where stat.user_id = p_user_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', mission.id,
      'title', mission.title,
      'description', mission.description,
      'cadence', mission.cadence,
      'difficulty', mission.difficulty,
      'stat_key', mission.stat_key,
      'xp_reward', mission.xp_reward,
      'active', mission.active,
      'archived_at', mission.archived_at,
      'created_at', mission.created_at,
      'completed', exists (
        select 1
        from public.levelup_completions completion
        where completion.user_id = p_user_id
          and completion.mission_id = mission.id
          and completion.recurrence_key = levelup_private.recurrence_key(mission.cadence, v_today)
      )
    )
    order by
      case mission.cadence when 'daily' then 1 when 'weekly' then 2 else 3 end,
      mission.created_at desc
  ), '[]'::jsonb)
  into v_missions
  from public.levelup_missions mission
  where mission.user_id = p_user_id and mission.active;

  return jsonb_build_object(
    'profile', jsonb_build_object('user_id', p_user_id, 'timezone', 'Asia/Manila'),
    'local_date', v_today,
    'progress', jsonb_build_object(
      'total_xp', v_progress.total_xp,
      'level', v_progress.level,
      'xp_into_level', v_progress.total_xp - v_current_threshold,
      'xp_for_next_level', v_next_level_xp,
      'current_streak', v_progress.current_streak,
      'best_streak', v_progress.best_streak,
      'last_active_date', v_progress.last_active_date
    ),
    'stats', v_stats,
    'missions', v_missions
  );
end;
$$;

create or replace function levelup_private.complete_mission(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_mission public.levelup_missions%rowtype;
  v_today date;
  v_recurrence_key text;
  v_completion_id uuid;
  v_before_achievements text[];
  v_new_achievements jsonb;
begin
  perform levelup_private.ensure_user_state(v_user_id);
  perform 1 from public.levelup_progress where user_id = v_user_id for update;

  select * into v_mission
  from public.levelup_missions mission
  where mission.id = p_mission_id
    and mission.user_id = v_user_id
    and mission.active
  for update;

  if not found then
    raise exception 'Active mission not found' using errcode = 'P0002';
  end if;

  v_today := levelup_private.current_local_date(v_user_id);
  v_recurrence_key := levelup_private.recurrence_key(v_mission.cadence, v_today);

  select coalesce(array_agg(earned.achievement_slug), array[]::text[])
  into v_before_achievements
  from public.levelup_user_achievements earned
  where earned.user_id = v_user_id;

  insert into public.levelup_completions
    (user_id, mission_id, recurrence_key, local_date, xp_awarded, stat_key)
  values
    (v_user_id, v_mission.id, v_recurrence_key, v_today, v_mission.xp_reward, v_mission.stat_key)
  on conflict (user_id, mission_id, recurrence_key) do nothing
  returning id into v_completion_id;

  if v_completion_id is null then
    raise exception 'Mission already completed for this period' using errcode = '23505';
  end if;

  perform levelup_private.recalculate_state(v_user_id, v_completion_id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', definition.slug,
    'title', definition.title,
    'description', definition.description,
    'icon_key', definition.icon_key
  ) order by definition.sort_order), '[]'::jsonb)
  into v_new_achievements
  from public.levelup_user_achievements earned
  join public.levelup_achievement_definitions definition
    on definition.slug = earned.achievement_slug
  where earned.user_id = v_user_id
    and not (earned.achievement_slug = any(v_before_achievements));

  return levelup_private.dashboard_payload(v_user_id) || jsonb_build_object(
    'event', jsonb_build_object(
      'type', 'mission_completed',
      'mission_id', v_mission.id,
      'completion_id', v_completion_id,
      'xp_awarded', v_mission.xp_reward,
      'stat_key', v_mission.stat_key,
      'new_achievements', v_new_achievements
    )
  );
end;
$$;

create or replace function levelup_private.undo_mission(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_mission public.levelup_missions%rowtype;
  v_today date;
  v_recurrence_key text;
  v_deleted_completion uuid;
begin
  perform levelup_private.ensure_user_state(v_user_id);
  perform 1 from public.levelup_progress where user_id = v_user_id for update;

  select * into v_mission
  from public.levelup_missions mission
  where mission.id = p_mission_id and mission.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Mission not found' using errcode = 'P0002';
  end if;

  v_today := levelup_private.current_local_date(v_user_id);
  v_recurrence_key := levelup_private.recurrence_key(v_mission.cadence, v_today);

  delete from public.levelup_completions completion
  where completion.user_id = v_user_id
    and completion.mission_id = v_mission.id
    and completion.recurrence_key = v_recurrence_key
  returning completion.id into v_deleted_completion;

  if v_deleted_completion is null then
    raise exception 'No current completion to undo' using errcode = 'P0002';
  end if;

  perform levelup_private.recalculate_state(v_user_id, null);

  return levelup_private.dashboard_payload(v_user_id) || jsonb_build_object(
    'event', jsonb_build_object(
      'type', 'mission_undone',
      'mission_id', v_mission.id,
      'completion_id', v_deleted_completion
    )
  );
end;
$$;

create or replace function public.get_levelup_dashboard()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  perform levelup_private.ensure_user_state(v_user_id);
  perform levelup_private.recalculate_state(v_user_id, null);
  return levelup_private.dashboard_payload(v_user_id);
end;
$$;

create or replace function public.complete_levelup_mission(p_mission_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select levelup_private.complete_mission(p_mission_id);
$$;

create or replace function public.undo_levelup_mission(p_mission_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select levelup_private.undo_mission(p_mission_id);
$$;

create or replace function public.get_levelup_progress(p_days integer default 30)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_today date;
  v_total_completions integer;
  v_period_xp bigint;
  v_daily jsonb;
  v_stats jsonb;
  v_progress jsonb;
begin
  if p_days < 1 or p_days > 365 then
    raise exception 'Progress range must be between 1 and 365 days' using errcode = '22023';
  end if;

  perform levelup_private.ensure_user_state(v_user_id);
  perform levelup_private.recalculate_state(v_user_id, null);
  v_today := levelup_private.current_local_date(v_user_id);

  select count(*)::integer, coalesce(sum(completion.xp_awarded), 0)
  into v_total_completions, v_period_xp
  from public.levelup_completions completion
  where completion.user_id = v_user_id
    and completion.local_date between (v_today - (p_days - 1)) and v_today;

  with daily_totals as (
    select
      completion.local_date,
      count(*)::integer as completion_count,
      sum(completion.xp_awarded)::bigint as xp
    from public.levelup_completions completion
    where completion.user_id = v_user_id
      and completion.local_date between (v_today - (p_days - 1)) and v_today
    group by completion.local_date
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'date', series.day::date,
    'completions', coalesce(daily.completion_count, 0),
    'xp', coalesce(daily.xp, 0)
  ) order by series.day), '[]'::jsonb)
  into v_daily
  from generate_series(v_today - (p_days - 1), v_today, interval '1 day') series(day)
  left join daily_totals daily on daily.local_date = series.day::date;

  select coalesce(jsonb_agg(jsonb_build_object('key', stat.stat_key, 'xp', stat.xp)
    order by case stat.stat_key
      when 'strength' then 1 when 'vitality' then 2 when 'intellect' then 3 else 4 end
  ), '[]'::jsonb)
  into v_stats
  from public.levelup_stats stat
  where stat.user_id = v_user_id;

  select jsonb_build_object(
    'total_xp', progress.total_xp,
    'level', progress.level,
    'current_streak', progress.current_streak,
    'best_streak', progress.best_streak,
    'last_active_date', progress.last_active_date
  )
  into v_progress
  from public.levelup_progress progress
  where progress.user_id = v_user_id;

  return jsonb_build_object(
    'days', p_days,
    'from_date', v_today - (p_days - 1),
    'to_date', v_today,
    'period_completions', v_total_completions,
    'period_xp', v_period_xp,
    'daily', v_daily,
    'stats', v_stats,
    'progress', v_progress
  );
end;
$$;

create or replace function public.get_levelup_activity(
  p_limit integer default 20,
  p_cursor_at timestamptz default null,
  p_cursor_id text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_result jsonb;
begin
  if p_limit < 1 or p_limit > 50 then
    raise exception 'Activity page size must be between 1 and 50' using errcode = '22023';
  end if;

  perform levelup_private.ensure_user_state(v_user_id);

  with all_events as (
    select
      'completion:' || completion.id::text as event_id,
      completion.completed_at as occurred_at,
      'mission_completed'::text as event_type,
      mission.title,
      jsonb_build_object(
        'mission_id', mission.id,
        'xp_awarded', completion.xp_awarded,
        'stat_key', completion.stat_key,
        'local_date', completion.local_date
      ) as metadata
    from public.levelup_completions completion
    join public.levelup_missions mission on mission.id = completion.mission_id
    where completion.user_id = v_user_id

    union all

    select
      'achievement:' || earned.achievement_slug as event_id,
      earned.unlocked_at as occurred_at,
      'achievement_unlocked'::text as event_type,
      definition.title,
      jsonb_build_object(
        'achievement_slug', definition.slug,
        'description', definition.description,
        'icon_key', definition.icon_key
      ) as metadata
    from public.levelup_user_achievements earned
    join public.levelup_achievement_definitions definition
      on definition.slug = earned.achievement_slug
    where earned.user_id = v_user_id
  ), filtered as (
    select *
    from all_events event
    where p_cursor_at is null
      or (event.occurred_at, event.event_id) < (p_cursor_at, coalesce(p_cursor_id, ''))
  ), page as (
    select *
    from filtered
    order by occurred_at desc, event_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', item.event_id,
        'occurred_at', item.occurred_at,
        'type', item.event_type,
        'title', item.title,
        'metadata', item.metadata
      ) order by item.occurred_at desc, item.event_id desc)
      from page item
    ), '[]'::jsonb),
    'next_cursor', case when (select count(*) from page) = p_limit then (
      select jsonb_build_object('at', tail.occurred_at, 'id', tail.event_id)
      from page tail
      order by tail.occurred_at asc, tail.event_id asc
      limit 1
    ) else null end
  )
  into v_result;

  return v_result;
end;
$$;

create or replace function public.get_levelup_achievements()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_result jsonb;
begin
  perform levelup_private.ensure_user_state(v_user_id);
  perform levelup_private.recalculate_state(v_user_id, null);

  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', definition.slug,
    'title', definition.title,
    'description', definition.description,
    'icon_key', definition.icon_key,
    'criteria_type', definition.criteria_type,
    'threshold', definition.threshold,
    'stat_key', definition.stat_key,
    'unlocked', earned.achievement_slug is not null,
    'unlocked_at', earned.unlocked_at
  ) order by definition.sort_order), '[]'::jsonb)
  into v_result
  from public.levelup_achievement_definitions definition
  left join public.levelup_user_achievements earned
    on earned.achievement_slug = definition.slug and earned.user_id = v_user_id;

  return v_result;
end;
$$;

alter table public.levelup_profiles enable row level security;
alter table public.levelup_missions enable row level security;
alter table public.levelup_completions enable row level security;
alter table public.levelup_progress enable row level security;
alter table public.levelup_stats enable row level security;
alter table public.levelup_achievement_definitions enable row level security;
alter table public.levelup_user_achievements enable row level security;

drop policy if exists levelup_profiles_select_own on public.levelup_profiles;
create policy levelup_profiles_select_own on public.levelup_profiles
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_missions_select_own on public.levelup_missions;
create policy levelup_missions_select_own on public.levelup_missions
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_missions_insert_own on public.levelup_missions;
create policy levelup_missions_insert_own on public.levelup_missions
for insert to authenticated
with check (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_missions_update_own on public.levelup_missions;
create policy levelup_missions_update_own on public.levelup_missions
for update to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())))
with check (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_completions_select_own on public.levelup_completions;
create policy levelup_completions_select_own on public.levelup_completions
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_progress_select_own on public.levelup_progress;
create policy levelup_progress_select_own on public.levelup_progress
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_stats_select_own on public.levelup_stats;
create policy levelup_stats_select_own on public.levelup_stats
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_achievement_definitions_select on public.levelup_achievement_definitions;
create policy levelup_achievement_definitions_select on public.levelup_achievement_definitions
for select to authenticated
using (levelup_private.is_allowed((select auth.uid())));

drop policy if exists levelup_user_achievements_select_own on public.levelup_user_achievements;
create policy levelup_user_achievements_select_own on public.levelup_user_achievements
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

revoke all on public.levelup_profiles from public, anon, authenticated;
revoke all on public.levelup_missions from public, anon, authenticated;
revoke all on public.levelup_completions from public, anon, authenticated;
revoke all on public.levelup_progress from public, anon, authenticated;
revoke all on public.levelup_stats from public, anon, authenticated;
revoke all on public.levelup_achievement_definitions from public, anon, authenticated;
revoke all on public.levelup_user_achievements from public, anon, authenticated;

grant select on public.levelup_profiles to authenticated;
grant select on public.levelup_missions to authenticated;
grant insert (user_id, title, description, cadence, difficulty, stat_key) on public.levelup_missions to authenticated;
grant update (title, description, cadence, difficulty, stat_key, active, archived_at) on public.levelup_missions to authenticated;
grant select on public.levelup_completions to authenticated;
grant select on public.levelup_progress to authenticated;
grant select on public.levelup_stats to authenticated;
grant select on public.levelup_achievement_definitions to authenticated;
grant select on public.levelup_user_achievements to authenticated;

revoke all on function levelup_private.is_allowed(uuid) from public, anon, authenticated;
revoke all on function levelup_private.set_updated_at() from public, anon, authenticated;
revoke all on function levelup_private.ensure_user_state(uuid) from public, anon, authenticated;
revoke all on function levelup_private.current_local_date(uuid) from public, anon, authenticated;
revoke all on function levelup_private.recurrence_key(text, date) from public, anon, authenticated;
revoke all on function levelup_private.recalculate_state(uuid, uuid) from public, anon, authenticated;
revoke all on function levelup_private.dashboard_payload(uuid) from public, anon, authenticated;
revoke all on function levelup_private.complete_mission(uuid) from public, anon, authenticated;
revoke all on function levelup_private.undo_mission(uuid) from public, anon, authenticated;

grant execute on function levelup_private.is_allowed(uuid) to authenticated;
grant execute on function levelup_private.ensure_user_state(uuid) to authenticated;
grant execute on function levelup_private.current_local_date(uuid) to authenticated;
grant execute on function levelup_private.recurrence_key(text, date) to authenticated;
grant execute on function levelup_private.recalculate_state(uuid, uuid) to authenticated;
grant execute on function levelup_private.dashboard_payload(uuid) to authenticated;
grant execute on function levelup_private.complete_mission(uuid) to authenticated;
grant execute on function levelup_private.undo_mission(uuid) to authenticated;

revoke all on function public.get_levelup_dashboard() from public, anon, authenticated;
revoke all on function public.complete_levelup_mission(uuid) from public, anon, authenticated;
revoke all on function public.undo_levelup_mission(uuid) from public, anon, authenticated;
revoke all on function public.get_levelup_progress(integer) from public, anon, authenticated;
revoke all on function public.get_levelup_activity(integer, timestamptz, text) from public, anon, authenticated;
revoke all on function public.get_levelup_achievements() from public, anon, authenticated;

grant execute on function public.get_levelup_dashboard() to authenticated;
grant execute on function public.complete_levelup_mission(uuid) to authenticated;
grant execute on function public.undo_levelup_mission(uuid) to authenticated;
grant execute on function public.get_levelup_progress(integer) to authenticated;
grant execute on function public.get_levelup_activity(integer, timestamptz, text) to authenticated;
grant execute on function public.get_levelup_achievements() to authenticated;

-- After the migration succeeds, authorize the single owner account once:
-- insert into levelup_private.allowed_users (user_id)
-- values ('YOUR-SUPABASE-AUTH-USER-UUID')
-- on conflict (user_id) do nothing;
