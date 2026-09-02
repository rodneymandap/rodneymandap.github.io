-- Level Up missed-focus consequences. Applied lazily on the next authenticated read.

create table if not exists public.levelup_xp_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.levelup_missions(id) on delete restrict,
  focus_date date not null,
  adjustment_type text not null check (adjustment_type = 'missed_daily_focus'),
  xp_delta smallint not null check (xp_delta = -25),
  created_at timestamptz not null default now(),
  unique (user_id, focus_date, mission_id, adjustment_type)
);

create index if not exists levelup_xp_adjustments_user_date_idx
  on public.levelup_xp_adjustments (user_id, focus_date desc, created_at desc);

alter table public.levelup_xp_adjustments enable row level security;

drop policy if exists levelup_xp_adjustments_select_own on public.levelup_xp_adjustments;
create policy levelup_xp_adjustments_select_own on public.levelup_xp_adjustments
for select to authenticated
using (user_id = (select auth.uid()) and levelup_private.is_allowed((select auth.uid())));

revoke all on public.levelup_xp_adjustments from public, anon, authenticated;
grant select on public.levelup_xp_adjustments to authenticated;

create or replace function levelup_private.reconcile_missed_daily_focus(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date;
  v_penalties jsonb;
begin
  perform levelup_private.ensure_user_state(p_user_id);
  perform 1 from public.levelup_progress where user_id = p_user_id for update;
  v_today := levelup_private.current_local_date(p_user_id);

  with inserted as (
    insert into public.levelup_xp_adjustments
      (user_id, mission_id, focus_date, adjustment_type, xp_delta)
    select
      p_user_id,
      focus.mission_id,
      focus.focus_date,
      'missed_daily_focus',
      -25
    from public.levelup_daily_focus focus
    join public.levelup_missions mission
      on mission.id = focus.mission_id and mission.user_id = focus.user_id
    where focus.user_id = p_user_id
      and focus.focus_date < v_today
      and not exists (
        select 1
        from public.levelup_completions completion
        where completion.user_id = p_user_id
          and completion.mission_id = focus.mission_id
          and completion.recurrence_key = levelup_private.recurrence_key(mission.cadence, focus.focus_date)
      )
    on conflict (user_id, focus_date, mission_id, adjustment_type) do nothing
    returning mission_id, focus_date, xp_delta, created_at
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'mission_id', inserted.mission_id,
    'title', mission.title,
    'focus_date', inserted.focus_date,
    'xp_delta', inserted.xp_delta,
    'created_at', inserted.created_at
  ) order by inserted.focus_date, mission.title), '[]'::jsonb)
  into v_penalties
  from inserted
  join public.levelup_missions mission on mission.id = inserted.mission_id;

  return v_penalties;
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

  select
    greatest(0::bigint, coalesce(sum(completion.xp_awarded), 0) + coalesce((
      select sum(adjustment.xp_delta)
      from public.levelup_xp_adjustments adjustment
      where adjustment.user_id = p_user_id
    ), 0)),
    count(*)::integer,
    max(completion.local_date)
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
    select local_date, local_date - (row_number() over (order by local_date))::integer as streak_group
    from activity_dates
  ), streaks as (
    select count(*)::integer as streak_length, max(local_date) as streak_end
    from numbered group by streak_group
  )
  select coalesce(max(streak_length), 0) into v_best_streak from streaks;

  with activity_dates as (
    select distinct completion.local_date
    from public.levelup_completions completion
    where completion.user_id = p_user_id
  ), numbered as (
    select local_date, local_date - (row_number() over (order by local_date))::integer as streak_group
    from activity_dates
  ), streaks as (
    select count(*)::integer as streak_length, max(local_date) as streak_end
    from numbered group by streak_group
  )
  select streak_length, streak_end into v_latest_streak, v_latest_streak_end
  from streaks order by streak_end desc limit 1;

  v_today := levelup_private.current_local_date(p_user_id);
  if v_latest_streak_end is not null and v_latest_streak_end >= (v_today - 1) then
    v_current_streak := v_latest_streak;
  end if;

  update public.levelup_progress
  set total_xp = v_total_xp, level = v_level, current_streak = v_current_streak,
      best_streak = v_best_streak, last_active_date = v_last_active, updated_at = now()
  where user_id = p_user_id;

  delete from public.levelup_user_achievements earned
  using public.levelup_achievement_definitions definition
  where earned.user_id = p_user_id and earned.achievement_slug = definition.slug
    and not (
      (definition.criteria_type = 'completion_count' and v_completion_count >= definition.threshold)
      or (definition.criteria_type = 'streak' and v_best_streak >= definition.threshold)
      or (definition.criteria_type = 'level' and v_level >= definition.threshold)
      or (definition.criteria_type = 'stat_xp' and coalesce((select stat.xp from public.levelup_stats stat where stat.user_id = p_user_id and stat.stat_key = definition.stat_key), 0) >= definition.threshold)
    );

  insert into public.levelup_user_achievements (user_id, achievement_slug, unlocked_at, source_completion_id)
  select p_user_id, definition.slug, now(), p_source_completion_id
  from public.levelup_achievement_definitions definition
  where (definition.criteria_type = 'completion_count' and v_completion_count >= definition.threshold)
    or (definition.criteria_type = 'streak' and v_best_streak >= definition.threshold)
    or (definition.criteria_type = 'level' and v_level >= definition.threshold)
    or (definition.criteria_type = 'stat_xp' and coalesce((select stat.xp from public.levelup_stats stat where stat.user_id = p_user_id and stat.stat_key = definition.stat_key), 0) >= definition.threshold)
  on conflict (user_id, achievement_slug) do nothing;
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
  v_penalties jsonb;
  v_previous_level integer;
begin
  perform levelup_private.ensure_user_state(v_user_id);
  select progress.level into v_previous_level
  from public.levelup_progress progress where progress.user_id = v_user_id;
  v_penalties := levelup_private.reconcile_missed_daily_focus(v_user_id);
  perform levelup_private.recalculate_state(v_user_id, null);
  return levelup_private.dashboard_payload(v_user_id) || jsonb_build_object(
    'new_penalties', v_penalties,
    'penalty_summary', case when jsonb_array_length(v_penalties) > 0 then jsonb_build_object(
      'count', jsonb_array_length(v_penalties),
      'xp_lost', (select coalesce(sum((item->>'xp_delta')::integer), 0) from jsonb_array_elements(v_penalties) item),
      'previous_level', v_previous_level
    ) else null end
  );
end;
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
  if p_days < 1 or p_days > 365 then raise exception 'Progress range must be between 1 and 365 days' using errcode = '22023'; end if;
  perform levelup_private.ensure_user_state(v_user_id);
  perform levelup_private.reconcile_missed_daily_focus(v_user_id);
  perform levelup_private.recalculate_state(v_user_id, null);
  v_today := levelup_private.current_local_date(v_user_id);

  select count(*)::integer into v_total_completions from public.levelup_completions completion
  where completion.user_id = v_user_id and completion.local_date between (v_today - (p_days - 1)) and v_today;

  select coalesce(sum(event.xp), 0) into v_period_xp from (
    select completion.local_date, completion.xp_awarded::bigint as xp from public.levelup_completions completion
    where completion.user_id = v_user_id and completion.local_date between (v_today - (p_days - 1)) and v_today
    union all
    select adjustment.focus_date, adjustment.xp_delta::bigint from public.levelup_xp_adjustments adjustment
    where adjustment.user_id = v_user_id and adjustment.focus_date between (v_today - (p_days - 1)) and v_today
  ) event;

  with daily_totals as (
    select event.local_date, sum(event.xp)::bigint as xp from (
      select completion.local_date, completion.xp_awarded::bigint as xp from public.levelup_completions completion
      where completion.user_id = v_user_id and completion.local_date between (v_today - (p_days - 1)) and v_today
      union all
      select adjustment.focus_date, adjustment.xp_delta::bigint from public.levelup_xp_adjustments adjustment
      where adjustment.user_id = v_user_id and adjustment.focus_date between (v_today - (p_days - 1)) and v_today
    ) event group by event.local_date
  )
  select coalesce(jsonb_agg(jsonb_build_object('date', series.day::date, 'completions', coalesce((select count(*) from public.levelup_completions completion where completion.user_id = v_user_id and completion.local_date = series.day::date), 0), 'xp', coalesce(daily.xp, 0)) order by series.day), '[]'::jsonb)
  into v_daily from generate_series(v_today - (p_days - 1), v_today, interval '1 day') series(day)
  left join daily_totals daily on daily.local_date = series.day::date;

  select coalesce(jsonb_agg(jsonb_build_object('key', stat.stat_key, 'xp', stat.xp) order by case stat.stat_key when 'strength' then 1 when 'vitality' then 2 when 'intellect' then 3 else 4 end), '[]'::jsonb) into v_stats from public.levelup_stats stat where stat.user_id = v_user_id;
  select jsonb_build_object('total_xp', progress.total_xp, 'level', progress.level, 'current_streak', progress.current_streak, 'best_streak', progress.best_streak, 'last_active_date', progress.last_active_date) into v_progress from public.levelup_progress progress where progress.user_id = v_user_id;
  return jsonb_build_object('days', p_days, 'from_date', v_today - (p_days - 1), 'to_date', v_today, 'period_completions', v_total_completions, 'period_xp', v_period_xp, 'daily', v_daily, 'stats', v_stats, 'progress', v_progress);
end;
$$;

create or replace function public.get_levelup_activity(p_limit integer default 20, p_cursor_at timestamptz default null, p_cursor_id text default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid()); v_result jsonb;
begin
  if p_limit < 1 or p_limit > 50 then raise exception 'Activity page size must be between 1 and 50' using errcode = '22023'; end if;
  perform levelup_private.ensure_user_state(v_user_id);
  perform levelup_private.reconcile_missed_daily_focus(v_user_id);
  perform levelup_private.recalculate_state(v_user_id, null);
  with all_events as (
    select 'completion:' || completion.id::text as event_id, completion.completed_at as occurred_at, 'mission_completed'::text as event_type, mission.title, jsonb_build_object('mission_id', mission.id, 'xp_awarded', completion.xp_awarded, 'stat_key', completion.stat_key, 'local_date', completion.local_date) as metadata from public.levelup_completions completion join public.levelup_missions mission on mission.id = completion.mission_id where completion.user_id = v_user_id
    union all
    select 'penalty:' || adjustment.id::text, adjustment.created_at, 'daily_focus_missed'::text, mission.title, jsonb_build_object('mission_id', mission.id, 'focus_date', adjustment.focus_date, 'xp_delta', adjustment.xp_delta) from public.levelup_xp_adjustments adjustment join public.levelup_missions mission on mission.id = adjustment.mission_id where adjustment.user_id = v_user_id
    union all
    select 'achievement:' || earned.achievement_slug, earned.unlocked_at, 'achievement_unlocked'::text, definition.title, jsonb_build_object('achievement_slug', definition.slug, 'description', definition.description, 'icon_key', definition.icon_key) from public.levelup_user_achievements earned join public.levelup_achievement_definitions definition on definition.slug = earned.achievement_slug where earned.user_id = v_user_id
  ), filtered as (
    select * from all_events event where p_cursor_at is null or (event.occurred_at, event.event_id) < (p_cursor_at, coalesce(p_cursor_id, ''))
  ), page as (
    select * from filtered order by occurred_at desc, event_id desc limit p_limit
  )
  select jsonb_build_object('items', coalesce((select jsonb_agg(jsonb_build_object('id', item.event_id, 'occurred_at', item.occurred_at, 'type', item.event_type, 'title', item.title, 'metadata', item.metadata) order by item.occurred_at desc, item.event_id desc) from page item), '[]'::jsonb), 'next_cursor', case when (select count(*) from page) = p_limit then (select jsonb_build_object('at', tail.occurred_at, 'id', tail.event_id) from page tail order by tail.occurred_at asc, tail.event_id asc limit 1) else null end) into v_result;
  return v_result;
end;
$$;

create or replace function public.get_levelup_achievements()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid()); v_result jsonb;
begin
  perform levelup_private.ensure_user_state(v_user_id);
  perform levelup_private.reconcile_missed_daily_focus(v_user_id);
  perform levelup_private.recalculate_state(v_user_id, null);
  select coalesce(jsonb_agg(jsonb_build_object('slug', definition.slug, 'title', definition.title, 'description', definition.description, 'icon_key', definition.icon_key, 'criteria_type', definition.criteria_type, 'threshold', definition.threshold, 'stat_key', definition.stat_key, 'unlocked', earned.achievement_slug is not null, 'unlocked_at', earned.unlocked_at) order by definition.sort_order), '[]'::jsonb) into v_result from public.levelup_achievement_definitions definition left join public.levelup_user_achievements earned on earned.achievement_slug = definition.slug and earned.user_id = v_user_id;
  return v_result;
end;
$$;

revoke all on function levelup_private.reconcile_missed_daily_focus(uuid) from public, anon, authenticated;
grant execute on function levelup_private.reconcile_missed_daily_focus(uuid) to authenticated;
