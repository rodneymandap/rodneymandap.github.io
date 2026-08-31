import { useEffect, useMemo, useState } from "react";

import { LevelUpIcon } from "../../components/levelup/LevelUpIcon";
import { useLevelUp } from "../../components/levelup/LevelUpProvider";
import { LevelUpShell } from "../../components/levelup/LevelUpShell";
import {
  LevelUpEmpty,
  LevelUpError,
  LevelUpLoading,
  LevelUpSection,
} from "../../components/levelup/LevelUpStates";
import {
  getLevelUpActivity,
  getLevelUpProgress,
} from "../../lib/levelup/supabase";
import {
  LEVELUP_STAT_LABELS,
  type LevelUpActivityItem,
  type LevelUpActivityPage,
  type LevelUpProgressReport,
} from "../../lib/levelup/types";

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00+08:00`)
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function ProgressContent() {
  const { dashboard, loading, error, refresh } = useLevelUp();
  const [report, setReport] = useState<LevelUpProgressReport | null>(null);
  const [activity, setActivity] = useState<LevelUpActivityItem[]>([]);
  const [cursor, setCursor] = useState<LevelUpActivityPage["next_cursor"]>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!dashboard) return;
    let active = true;
    setReportLoading(true);
    Promise.all([getLevelUpProgress(30), getLevelUpActivity(null)])
      .then(([nextReport, activityPage]) => {
        if (!active) return;
        setReport(nextReport);
        setActivity(activityPage.items);
        setCursor(activityPage.next_cursor);
      })
      .catch((loadError) => {
        if (active)
          setReportError(
            loadError instanceof Error ? loadError.message : "Progress report could not load."
          );
      })
      .finally(() => {
        if (active) setReportLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dashboard]);

  const maxDailyXp = useMemo(
    () => Math.max(1, ...(report?.daily.map((day) => day.xp) ?? [1])),
    [report?.daily]
  );
  const maxStatXp = useMemo(
    () => Math.max(1, ...(report?.stats.map((stat) => stat.xp) ?? [1])),
    [report?.stats]
  );

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setReportError("");
    try {
      const page = await getLevelUpActivity(cursor);
      setActivity((current) => [...current, ...page.items]);
      setCursor(page.next_cursor);
    } catch (loadError) {
      setReportError(loadError instanceof Error ? loadError.message : "More activity could not load.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return <LevelUpLoading label="Calculating progress" />;
  if (error || !dashboard) return <LevelUpError message={error || "Profile unavailable."} onRetry={() => void refresh()} />;
  if (reportLoading) return <LevelUpLoading label="Calculating 30-day analytics" />;
  if (reportError && !report) return <LevelUpError message={reportError} onRetry={() => window.location.reload()} />;
  if (!report) return null;

  return (
    <div className="space-y-10">
      {reportError && <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">{reportError}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="levelup-metric-card"><LevelUpIcon name="bolt" className="h-5 w-5 text-cyan-300" /><p className="mt-5 text-3xl font-black text-white">{report.period_xp}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">XP · last 30 days</p></article>
        <article className="levelup-metric-card"><LevelUpIcon name="check" className="h-5 w-5 text-emerald-300" /><p className="mt-5 text-3xl font-black text-white">{report.period_completions}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Missions completed</p></article>
        <article className="levelup-metric-card"><LevelUpIcon name="flame" className="h-5 w-5 text-orange-300" /><p className="mt-5 text-3xl font-black text-white">{report.progress.current_streak}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current streak</p></article>
        <article className="levelup-metric-card"><LevelUpIcon name="crown" className="h-5 w-5 text-amber-300" /><p className="mt-5 text-3xl font-black text-white">{report.progress.best_streak}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Best streak</p></article>
      </section>

      <LevelUpSection title="30-day activity" detail={`${formatShortDate(report.from_date)} – ${formatShortDate(report.to_date)} · derived from confirmed completions`}>
        <div className="levelup-panel p-5 sm:p-7">
          <div className="flex h-64 items-end gap-1 sm:gap-2" aria-label="Daily XP bar chart">
            {report.daily.map((day, index) => {
              const height = day.xp === 0 ? 2 : Math.max(8, (day.xp / maxDailyXp) * 100);
              const showLabel = index === 0 || index === report.daily.length - 1 || index % 7 === 0;
              return (
                <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                  <div className="relative flex flex-1 items-end">
                    <span className="levelup-chart-tooltip">{formatShortDate(day.date)} · {day.xp} XP · {day.completions} missions</span>
                    <span className={`w-full rounded-t-sm transition-colors ${day.xp ? "bg-gradient-to-t from-violet-600/70 to-cyan-300/90 group-hover:to-white" : "bg-slate-800"}`} style={{ height: `${height}%` }} />
                  </div>
                  <span className="mt-2 h-4 truncate text-center text-[9px] text-slate-600">{showLabel ? formatShortDate(day.date) : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </LevelUpSection>

      <LevelUpSection title="Stat distribution" detail="Every point reflects XP awarded by a completed mission.">
        <div className="levelup-panel grid gap-5 p-6 lg:grid-cols-2">
          {report.stats.map((stat) => (
            <div key={stat.key}>
              <div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-bold text-slate-300"><LevelUpIcon name={stat.key} className="h-4 w-4 text-cyan-300" />{LEVELUP_STAT_LABELS[stat.key]}</span><span className="font-mono text-slate-500">{stat.xp} XP</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800"><span className="block h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-300" style={{ width: `${Math.max(stat.xp ? 4 : 0, (stat.xp / maxStatXp) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </LevelUpSection>

      <LevelUpSection title="System log" detail="Latest events load 20 at a time to keep history queries small.">
        {activity.length === 0 ? <LevelUpEmpty icon="progress" title="No activity recorded" message="Completed missions and unlocked achievements will appear here." /> : (
          <div className="levelup-panel divide-y divide-slate-800/80 overflow-hidden">
            {activity.map((item) => (
              <article key={item.id} className="flex gap-4 p-5 sm:p-6">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl border ${item.type === "achievement_unlocked" ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-200"}`}><LevelUpIcon name={item.type === "achievement_unlocked" ? item.metadata.icon_key ?? "achievements" : "check"} /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-bold text-white">{item.title}</h3><time className="text-xs text-slate-600">{formatTimestamp(item.occurred_at)}</time></div><p className="mt-1 text-sm text-slate-500">{item.type === "achievement_unlocked" ? item.metadata.description : `Mission completed · +${item.metadata.xp_awarded ?? 0} ${item.metadata.stat_key ?? ""} XP`}</p></div>
              </article>
            ))}
            {cursor && <div className="p-4 text-center"><button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="levelup-button-secondary">{loadingMore ? "Loading history…" : "Load next 20"}</button></div>}
          </div>
        )}
      </LevelUpSection>
    </div>
  );
}

export default function LevelUpProgressPage(): JSX.Element {
  return (
    <LevelUpShell title="Progress Matrix" subtitle="Read your recent completion history without background analytics or aggregation jobs.">
      <ProgressContent />
    </LevelUpShell>
  );
}
