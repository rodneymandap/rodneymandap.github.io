-- Level Up consistency loop: persisted daily focus selection.

create table if not exists public.levelup_daily_focus (
  user_id uuid not null references public.levelup_profiles(user_id) on delete cascade,
  focus_date date not null,
  mission_id uuid not null references public.levelup_missions(id) on delete cascade,
  position smallint not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, focus_date, position),
  unique (user_id, focus_date, mission_id)
);

create index if not exists levelup_daily_focus_lookup_idx
  on public.levelup_daily_focus (user_id, focus_date, position);

alter table public.levelup_daily_focus enable row level security;

drop policy if exists levelup_daily_focus_select_own on public.levelup_daily_focus;
create policy levelup_daily_focus_select_own on public.levelup_daily_focus
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

revoke all on public.levelup_daily_focus from public, anon, authenticated;
grant select on public.levelup_daily_focus to authenticated;

create or replace function levelup_private.set_daily_focus(p_mission_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_today date;
  v_count integer;
  v_valid_count integer;
begin
  perform levelup_private.ensure_user_state(v_user_id);
  v_today := levelup_private.current_local_date(v_user_id);
  v_count := coalesce(cardinality(p_mission_ids), 0);

  if v_count < 1 or v_count > 3 then
    raise exception 'Choose between one and three focus missions' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(p_mission_ids) as selected(mission_id)
    where selected.mission_id is null
  ) or (
    select count(distinct selected.mission_id)
    from unnest(p_mission_ids) as selected(mission_id)
  ) <> v_count then
    raise exception 'Focus missions must be unique and non-null' using errcode = '22023';
  end if;

  select count(*) into v_valid_count
  from public.levelup_missions mission
  where mission.id = any(p_mission_ids)
    and mission.user_id = v_user_id
    and mission.active
    and not exists (
      select 1
      from public.levelup_completions completion
      where completion.user_id = v_user_id
        and completion.mission_id = mission.id
        and completion.recurrence_key = levelup_private.recurrence_key(mission.cadence, v_today)
    );

  if v_valid_count <> v_count then
    raise exception 'Focus missions must be active, unfinished, and owned by the current user' using errcode = '22023';
  end if;

  delete from public.levelup_daily_focus focus
  where focus.user_id = v_user_id and focus.focus_date = v_today;

  insert into public.levelup_daily_focus (user_id, focus_date, mission_id, position)
  select v_user_id, v_today, selected.mission_id, selected.position::smallint
  from unnest(p_mission_ids) with ordinality as selected(mission_id, position);

  return levelup_private.dashboard_payload(v_user_id);
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
  v_daily_focus jsonb;
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
      when 'strength' then 1 when 'vitality' then 2 when 'intellect' then 3 else 4
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
        select 1 from public.levelup_completions completion
        where completion.user_id = p_user_id
          and completion.mission_id = mission.id
          and completion.recurrence_key = levelup_private.recurrence_key(mission.cadence, v_today)
      )
    )
    order by case mission.cadence when 'daily' then 1 when 'weekly' then 2 else 3 end,
      mission.created_at desc
  ), '[]'::jsonb)
  into v_missions
  from public.levelup_missions mission
  where mission.user_id = p_user_id and mission.active;

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
        select 1 from public.levelup_completions completion
        where completion.user_id = p_user_id
          and completion.mission_id = mission.id
          and completion.recurrence_key = levelup_private.recurrence_key(mission.cadence, v_today)
      ),
      'position', focus.position
    ) order by focus.position
  ), '[]'::jsonb)
  into v_daily_focus
  from public.levelup_daily_focus focus
  join public.levelup_missions mission
    on mission.id = focus.mission_id and mission.user_id = focus.user_id and mission.active
  where focus.user_id = p_user_id and focus.focus_date = v_today;

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
    'missions', v_missions,
    'daily_focus', v_daily_focus
  );
end;
$$;

create or replace function public.set_levelup_daily_focus(p_mission_ids uuid[])
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select levelup_private.set_daily_focus(p_mission_ids);
$$;

revoke all on function levelup_private.set_daily_focus(uuid[]) from public, anon, authenticated;
grant execute on function levelup_private.set_daily_focus(uuid[]) to authenticated;

revoke all on function public.set_levelup_daily_focus(uuid[]) from public, anon, authenticated;
grant execute on function public.set_levelup_daily_focus(uuid[]) to authenticated;
