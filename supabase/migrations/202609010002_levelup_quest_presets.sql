-- Stable identities for opt-in personal-plan quest presets.

alter table public.levelup_missions
  add column if not exists preset_key text;

alter table public.levelup_missions
  drop constraint if exists levelup_missions_preset_key_format;
alter table public.levelup_missions
  add constraint levelup_missions_preset_key_format
  check (
    preset_key is null
    or preset_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  );

create unique index if not exists levelup_missions_user_preset_key_idx
  on public.levelup_missions (user_id, preset_key);

grant insert (preset_key) on public.levelup_missions to authenticated;

-- Keep the dashboard payload aligned with the mission table interface.
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
      'preset_key', mission.preset_key,
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
      'preset_key', mission.preset_key,
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
