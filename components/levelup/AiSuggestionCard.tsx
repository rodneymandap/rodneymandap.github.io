import {
  LEVELUP_CADENCE_LABELS,
  LEVELUP_DIFFICULTY_XP,
  LEVELUP_STAT_LABELS,
} from "../../lib/levelup/types";
import type { LevelUpAiQuestSuggestion } from "../../lib/levelup/ai/schemas";
import { LevelUpIcon } from "./LevelUpIcon";

export function AiSuggestionCard({
  suggestion,
  onReview,
}: {
  suggestion: LevelUpAiQuestSuggestion;
  onReview: () => void;
}) {
  return (
    <article className="levelup-panel border-cyan-300/15 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="levelup-tag text-cyan-200">✦ AI Generated</span>
        <span className="levelup-tag text-slate-400">
          {LEVELUP_CADENCE_LABELS[suggestion.cadence]}
        </span>
        <span className="levelup-tag text-violet-200">
          {suggestion.difficulty} · {LEVELUP_DIFFICULTY_XP[suggestion.difficulty]} XP
        </span>
      </div>
      <h3 className="mt-4 text-lg font-black text-white">{suggestion.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{suggestion.description}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        {suggestion.objectives.map((objective) => (
          <li key={objective} className="flex gap-2">
            <span className="mt-1 text-cyan-300">◆</span>
            <span>{objective}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-slate-600">
        {suggestion.reasoningSummary}
      </p>
      <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          <LevelUpIcon name={suggestion.statKey} className="h-4 w-4 text-cyan-300" />
          {LEVELUP_STAT_LABELS[suggestion.statKey]}
        </span>
        <button type="button" onClick={onReview} className="levelup-button-secondary">
          <LevelUpIcon name="edit" />Review quest
        </button>
      </div>
    </article>
  );
}

