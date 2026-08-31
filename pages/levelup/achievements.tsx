import { useEffect, useMemo, useState } from "react";

import { LevelUpIcon } from "../../components/levelup/LevelUpIcon";
import { useLevelUp } from "../../components/levelup/LevelUpProvider";
import { LevelUpShell } from "../../components/levelup/LevelUpShell";
import {
  LevelUpError,
  LevelUpLoading,
} from "../../components/levelup/LevelUpStates";
import { getLevelUpAchievements } from "../../lib/levelup/supabase";
import type { LevelUpAchievement } from "../../lib/levelup/types";

function formatUnlockDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function AchievementsContent() {
  const { dashboard, loading, error, refresh } = useLevelUp();
  const [achievements, setAchievements] = useState<LevelUpAchievement[]>([]);
  const [achievementLoading, setAchievementLoading] = useState(true);
  const [achievementError, setAchievementError] = useState("");

  useEffect(() => {
    if (!dashboard) return;
    let active = true;
    getLevelUpAchievements()
      .then((data) => {
        if (active) setAchievements(data);
      })
      .catch((loadError) => {
        if (active) setAchievementError(loadError instanceof Error ? loadError.message : "Achievements could not load.");
      })
      .finally(() => {
        if (active) setAchievementLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dashboard]);

  const unlockedCount = useMemo(
    () => achievements.filter((achievement) => achievement.unlocked).length,
    [achievements]
  );

  if (loading) return <LevelUpLoading label="Opening achievement archive" />;
  if (error || !dashboard) return <LevelUpError message={error || "Profile unavailable."} onRetry={() => void refresh()} />;
  if (achievementLoading) return <LevelUpLoading label="Evaluating achievement records" />;
  if (achievementError) return <LevelUpError message={achievementError} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-8">
      <section className="levelup-level-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Achievement archive</p><p className="mt-3 text-4xl font-black text-white">{unlockedCount} <span className="text-lg text-slate-500">/ {achievements.length} unlocked</span></p><p className="mt-2 text-sm text-slate-500">Unlocks are evaluated atomically whenever mission history changes.</p></div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-200"><LevelUpIcon name="crown" className="h-11 w-11" /></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {achievements.map((achievement) => (
          <article key={achievement.slug} className={`levelup-achievement-card ${achievement.unlocked ? "levelup-achievement-unlocked" : ""}`}>
            <div className={`mb-5 inline-flex rounded-2xl border p-3.5 ${achievement.unlocked ? "border-amber-300/30 bg-amber-300/10 text-amber-200" : "border-slate-700 bg-slate-900 text-slate-600"}`}><LevelUpIcon name={achievement.icon_key} className="h-7 w-7" /></div>
            <div className="flex items-start justify-between gap-4"><h2 className={`text-lg font-black ${achievement.unlocked ? "text-white" : "text-slate-500"}`}>{achievement.title}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${achievement.unlocked ? "bg-amber-300/10 text-amber-200" : "bg-slate-800 text-slate-600"}`}>{achievement.unlocked ? "Unlocked" : "Locked"}</span></div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{achievement.description}</p>
            <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-600">{achievement.unlocked && achievement.unlocked_at ? `Unlocked ${formatUnlockDate(achievement.unlocked_at)}` : "Continue completing missions to qualify."}</div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default function LevelUpAchievementsPage(): JSX.Element {
  return (
    <LevelUpShell title="Achievement Archive" subtitle="Milestones unlocked by consistency, growth, and accumulated skill.">
      <AchievementsContent />
    </LevelUpShell>
  );
}
