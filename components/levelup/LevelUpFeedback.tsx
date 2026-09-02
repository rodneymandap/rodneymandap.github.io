import { useEffect } from "react";

import type { LevelUpFeedback as LevelUpFeedbackValue } from "../../lib/levelup/types";
import { LevelUpIcon } from "./LevelUpIcon";

export function LevelUpFeedback({
  feedback,
  onDismiss,
}: {
  feedback: LevelUpFeedbackValue;
  onDismiss: () => void;
}): JSX.Element {
  const ceremonial = feedback.tone === "level" || feedback.dailyClear || feedback.comeback;

  useEffect(() => {
    if (feedback.tone === "error") return;
    const timeout = window.setTimeout(onDismiss, ceremonial ? 5600 : 4200);
    return () => window.clearTimeout(timeout);
  }, [ceremonial, feedback, onDismiss]);

  return (
    <div className={ceremonial ? "levelup-feedback-stage" : "levelup-feedback-toast"} role={feedback.tone === "error" || feedback.tone === "penalty" ? "alert" : "status"} aria-live="polite">
      {ceremonial && <div className="levelup-feedback-burst" aria-hidden="true" />}
      <div className={`levelup-feedback-card levelup-feedback-${feedback.tone}`}>
        <div className="levelup-feedback-icon">
          <LevelUpIcon name={feedback.tone === "error" || feedback.tone === "penalty" ? "shield" : feedback.tone === "level" ? "crown" : feedback.dailyClear ? "check" : "spark"} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
          {feedback.tone === "level" ? "Rank advanced" : feedback.tone === "penalty" ? "Route consequence" : feedback.dailyClear ? "Route complete" : "System update"}
        </p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{feedback.title}</h2>
        <p className="mt-2 text-sm text-slate-300">{feedback.message}</p>
        {feedback.xp !== undefined && <div className="levelup-xp-orb" aria-label={`${Math.abs(feedback.xp)} experience points ${feedback.xp < 0 ? "lost" : "earned"}`}>{feedback.xp > 0 ? "+" : ""}{feedback.xp} XP</div>}
        {feedback.achievements?.map((achievement) => (
          <p key={achievement.slug} className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-200">Achievement unlocked · {achievement.title}</p>
        ))}
        <button type="button" onClick={onDismiss} className="absolute right-3 top-3 text-slate-500 hover:text-white" aria-label="Dismiss notification"><LevelUpIcon name="close" /></button>
      </div>
    </div>
  );
}
