import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DailyBriefing } from "../../components/levelup/DailyBriefing";
import { LevelUpHero, type LevelUpHeroState } from "../../components/levelup/LevelUpHero";
import { LevelUpIcon } from "../../components/levelup/LevelUpIcon";
import { MissionCard } from "../../components/levelup/MissionCard";
import { SystemAssistant } from "../../components/levelup/SystemAssistant";
import { useLevelUp } from "../../components/levelup/LevelUpProvider";
import { LevelUpShell } from "../../components/levelup/LevelUpShell";
import {
  LevelUpEmpty,
  LevelUpError,
  LevelUpLoading,
  LevelUpSection,
} from "../../components/levelup/LevelUpStates";
import {
  LEVELUP_STAT_LABELS,
  isLevelUpComebackDay,
  type LevelUpCadence,
} from "../../lib/levelup/types";

function DashboardContent() {
  const {
    dashboard,
    loading,
    error,
    refresh,
    busyMissionId,
    completeMission,
    undoMission,
    focusSaving,
    saveDailyFocus,
  } = useLevelUp();

  const [briefingOpen, setBriefingOpen] = useState(false);
  const [postponedDate, setPostponedDate] = useState<string | null>(null);
  const dailyFocus = dashboard?.daily_focus ?? [];
  const unfinishedMissions = useMemo(
    () => dashboard?.missions.filter((mission) => !mission.completed) ?? [],
    [dashboard?.missions]
  );

  useEffect(() => {
    if (
      dashboard &&
      dailyFocus.length === 0 &&
      unfinishedMissions.length > 0 &&
      postponedDate !== dashboard.local_date
    ) {
      setBriefingOpen(true);
    }
  }, [dailyFocus.length, dashboard, postponedDate, unfinishedMissions.length]);

  if (loading) return <LevelUpLoading />;
  if (error || !dashboard)
    return <LevelUpError message={error || "No profile data was returned."} onRetry={() => void refresh()} />;

  const progressPercent = Math.min(
    100,
    Math.round((dashboard.progress.xp_into_level / dashboard.progress.xp_for_next_level) * 100)
  );
  const comeback = isLevelUpComebackDay(
    dashboard.progress.last_active_date,
    dashboard.local_date
  );
  const focusComplete =
    dailyFocus.length > 0 && dailyFocus.every((mission) => mission.completed);
  const heroState: LevelUpHeroState = comeback
    ? "comeback"
    : focusComplete
    ? "celebrate"
    : dailyFocus.length > 0
    ? "focused"
    : "idle";
  const focusIds = new Set(dailyFocus.map((mission) => mission.id));
  const nextFocusId = dailyFocus.find((mission) => !mission.completed)?.id;
  const missionGroups: Array<{ cadence: LevelUpCadence; title: string; detail: string }> = [
    { cadence: "daily", title: "Today’s missions", detail: "Fresh objectives for the current Manila date." },
    { cadence: "weekly", title: "Weekly operations", detail: "Complete once before the ISO week rolls over." },
    { cadence: "once", title: "Main quests", detail: "Significant objectives that remain complete." },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.35fr]">
        <LevelUpHero level={dashboard.progress.level} state={heroState} />
        <div className="grid gap-4">
        <div className="levelup-level-card relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Current rank</p>
              <div className="mt-2 flex items-end gap-4">
                <span className="text-7xl font-black leading-none tracking-[-0.06em] text-white">{dashboard.progress.level}</span>
                <span className="mb-2 text-lg font-bold text-slate-400">Level</span>
              </div>
            </div>
            <div className="w-full max-w-xl">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300">Experience progress</span>
                <span className="font-mono text-cyan-200">{dashboard.progress.xp_into_level} / {dashboard.progress.xp_for_next_level} XP</span>
              </div>
              <div className="levelup-xp-track" role="progressbar" aria-valuemin={0} aria-valuemax={dashboard.progress.xp_for_next_level} aria-valuenow={dashboard.progress.xp_into_level} aria-label="Experience to next level">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500"><span>{dashboard.progress.total_xp} total XP</span><span>{progressPercent}% to Level {dashboard.progress.level + 1}</span></div>
            </div>
          </div>
        </div>

        <div className="levelup-panel flex items-center justify-between p-6 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Current streak</p>
            <div className="mt-3 flex items-end gap-3"><span className="text-5xl font-black text-white">{dashboard.progress.current_streak}</span><span className="mb-1 text-sm font-bold text-slate-500">days</span></div>
            <p className="mt-3 text-sm text-slate-500">Best run: {dashboard.progress.best_streak} days</p>
          </div>
          <div className="rounded-3xl border border-orange-400/20 bg-orange-400/10 p-5 text-orange-300"><LevelUpIcon name="flame" className="h-10 w-10" /></div>
        </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {dashboard.stats.map((stat) => (
          <article key={stat.key} className="levelup-stat-card">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-2.5 text-cyan-200"><LevelUpIcon name={stat.key} className="h-5 w-5" /></span>
              <span className="font-mono text-xs text-slate-600">STAT</span>
            </div>
            <p className="mt-5 text-2xl font-black text-white">{stat.xp}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{LEVELUP_STAT_LABELS[stat.key]} XP</p>
          </article>
        ))}
      </section>

      <SystemAssistant
        userId={dashboard.profile.user_id}
        onMissionSaved={refresh}
      />

      {comeback && (
        <section className="levelup-comeback-card" aria-label="Comeback quest">
          <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-3 text-violet-200"><LevelUpIcon name="spark" className="h-7 w-7" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Comeback quest</p>
            <h2 className="mt-1 text-xl font-black text-white">Complete any mission today</h2>
            <p className="mt-1 text-sm text-slate-400">Your history stays honest. Your return still deserves a victory.</p>
          </div>
          <span className="levelup-tag whitespace-nowrap text-violet-200">No bonus XP</span>
        </section>
      )}

      {dailyFocus.length === 0 && postponedDate === dashboard.local_date && unfinishedMissions.length > 0 && (
        <section className="levelup-briefing-banner">
          <div><p className="font-black text-white">Your daily route is still open.</p><p className="mt-1 text-sm text-slate-500">Choose up to three quests whenever you are ready.</p></div>
          <button type="button" onClick={() => setBriefingOpen(true)} className="levelup-button-secondary"><LevelUpIcon name="quests" />Open briefing</button>
        </section>
      )}

      {dailyFocus.length > 0 && (
        <LevelUpSection
          title={focusComplete ? "Daily route cleared" : "Today’s focus route"}
          detail={focusComplete ? "All selected quests are complete. Momentum secured." : `${dailyFocus.filter((mission) => mission.completed).length} of ${dailyFocus.length} focus quests complete.`}
        >
          <div className="mb-3 flex justify-end">
            {dailyFocus.every((mission) => !mission.completed) ? (
              <button type="button" onClick={() => setBriefingOpen(true)} className="text-xs font-bold text-cyan-300 hover:text-white">Edit daily focus</button>
            ) : (
              <span className="text-xs font-semibold text-slate-600">Route locked after first completion</span>
            )}
          </div>
          <div className="grid gap-3 2xl:grid-cols-2">
            {dailyFocus.map((mission) => (
              <div key={mission.id} className={mission.id === nextFocusId ? "levelup-focus-next" : ""}>
                {mission.id === nextFocusId && <span className="levelup-next-label">Next quest</span>}
                <MissionCard mission={mission} busy={busyMissionId === mission.id} onComplete={() => void completeMission(mission.id)} onUndo={() => void undoMission(mission.id)} />
              </div>
            ))}
          </div>
        </LevelUpSection>
      )}

      {dashboard.missions.length === 0 ? (
        <LevelUpEmpty title="No missions assigned" message="Your command center is ready. Create the first mission and decide which stat it will strengthen." action={{ href: "/levelup/quests", label: "Create first mission" }} />
      ) : (
        missionGroups.map((group) => {
          const missions = dashboard.missions.filter((mission) => mission.cadence === group.cadence && !focusIds.has(mission.id));
          if (missions.length === 0) return null;
          return (
            <LevelUpSection key={group.cadence} title={group.title} detail={group.detail}>
              <div className="grid gap-3 2xl:grid-cols-2">
                {missions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} busy={busyMissionId === mission.id} onComplete={() => void completeMission(mission.id)} onUndo={() => void undoMission(mission.id)} />
                ))}
              </div>
            </LevelUpSection>
          );
        })
      )}

      <div className="flex justify-center">
        <Link href="/levelup/quests" className="levelup-button-secondary"><LevelUpIcon name="quests" />Manage quest log</Link>
      </div>

      <DailyBriefing
        open={briefingOpen}
        missions={unfinishedMissions}
        initialMissionIds={dailyFocus.map((mission) => mission.id)}
        saving={focusSaving}
        onSave={saveDailyFocus}
        onPostpone={() => {
          setPostponedDate(dashboard.local_date);
          setBriefingOpen(false);
        }}
        onClose={() => setBriefingOpen(false)}
      />
    </div>
  );
}

export default function LevelUpDashboardPage(): JSX.Element {
  return (
    <LevelUpShell title="Command Center" subtitle="Act on today’s missions and keep your momentum visible.">
      <DashboardContent />
    </LevelUpShell>
  );
}
