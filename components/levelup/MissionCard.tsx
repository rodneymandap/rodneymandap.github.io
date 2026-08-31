import {
  LEVELUP_CADENCE_LABELS,
  LEVELUP_STAT_LABELS,
  type LevelUpMission,
} from "../../lib/levelup/types";
import { LevelUpIcon } from "./LevelUpIcon";

const difficultyStyles = {
  easy: "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200",
  normal: "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-200",
  hard: "border-violet-400/20 bg-violet-400/[0.07] text-violet-200",
  epic: "border-amber-400/25 bg-amber-400/[0.08] text-amber-200",
};

export function MissionCard({
  mission,
  busy,
  onComplete,
  onUndo,
}: {
  mission: LevelUpMission;
  busy: boolean;
  onComplete: () => void;
  onUndo: () => void;
}): JSX.Element {
  return (
    <article className={`levelup-mission-card ${mission.completed ? "levelup-mission-complete" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${difficultyStyles[mission.difficulty]}`}>
            {mission.difficulty} · {mission.xp_reward} XP
          </span>
          <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {LEVELUP_CADENCE_LABELS[mission.cadence]}
          </span>
        </div>
        <h3 className={`text-base font-black ${mission.completed ? "text-slate-500 line-through decoration-cyan-400/50" : "text-white"}`}>
          {mission.title}
        </h3>
        {mission.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{mission.description}</p>}
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <LevelUpIcon name={mission.stat_key} className="h-4 w-4 text-cyan-300" />
          <span>{LEVELUP_STAT_LABELS[mission.stat_key]}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={mission.completed ? onUndo : onComplete}
        disabled={busy}
        className={`levelup-mission-action ${mission.completed ? "levelup-mission-action-done" : ""}`}
        aria-label={mission.completed ? `Undo ${mission.title}` : `Complete ${mission.title}`}
      >
        <LevelUpIcon name={busy ? "spark" : mission.completed ? "undo" : "check"} className={`h-5 w-5 ${busy ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">{busy ? "Saving" : mission.completed ? "Undo" : "Complete"}</span>
      </button>
    </article>
  );
}
