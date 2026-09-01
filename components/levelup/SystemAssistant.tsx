import { FormEvent, useState } from "react";

import { requestLevelUpAi } from "../../lib/levelup/ai/client";
import type { LevelUpAiQuestSuggestion } from "../../lib/levelup/ai/schemas";
import { AiMissionReviewDialog } from "./AiMissionReviewDialog";
import { AiSuggestionCard } from "./AiSuggestionCard";
import { LevelUpIcon } from "./LevelUpIcon";

export function SystemAssistant({
  userId,
  onMissionSaved,
}: {
  userId: string;
  onMissionSaved: () => Promise<void>;
}) {
  const [focusArea, setFocusArea] = useState("");
  const [question, setQuestion] = useState("");
  const [suggestions, setSuggestions] = useState<LevelUpAiQuestSuggestion[]>([]);
  const [coachAnswer, setCoachAnswer] = useState("");
  const [reviewing, setReviewing] = useState<LevelUpAiQuestSuggestion | null>(null);
  const [busy, setBusy] = useState<"daily" | "coach" | null>(null);
  const [error, setError] = useState("");

  async function generateDaily() {
    if (busy) return;
    setBusy("daily");
    setError("");
    setCoachAnswer("");
    try {
      const result = await requestLevelUpAi({
        action: "daily",
        ...(focusArea.trim() ? { focusArea: focusArea.trim() } : {}),
      });
      if (result.action === "daily") setSuggestions(result.suggestions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The System is unavailable.");
    } finally {
      setBusy(null);
    }
  }

  async function askCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = question.trim();
    if (!message || busy) return;
    setBusy("coach");
    setError("");
    try {
      const result = await requestLevelUpAi({ action: "coach", message });
      if (result.action === "coach") {
        setCoachAnswer(result.answer);
        setSuggestions(result.suggestions);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The System is unavailable.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="levelup-panel overflow-hidden" aria-labelledby="system-assistant-title">
      <div className="border-b border-cyan-300/10 bg-cyan-300/[0.03] p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200"><LevelUpIcon name="spark" /></span>
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">System assistant</p><h2 id="system-assistant-title" className="mt-1 text-xl font-black text-white">Plan the next move</h2><p className="mt-1 text-sm text-slate-500">Recommendations only. You remain in control of every quest and reward.</p></div>
        </div>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-2 sm:p-7">
        <div>
          <label htmlFor="daily-focus-area" className="levelup-label">Daily mission focus <span className="normal-case tracking-normal text-slate-600">(optional)</span></label>
          <input id="daily-focus-area" className="levelup-input" maxLength={120} value={focusArea} onChange={(event) => setFocusArea(event.target.value)} placeholder="e.g. communication or recovery" />
          <button type="button" onClick={() => void generateDaily()} disabled={Boolean(busy)} className="levelup-button-primary mt-3 w-full justify-center"><LevelUpIcon name={busy === "daily" ? "spark" : "target"} className={busy === "daily" ? "h-5 w-5 animate-spin" : "h-5 w-5"} />{busy === "daily" ? "Generating missions…" : "Generate Daily Missions"}</button>
        </div>
        <form onSubmit={askCoach}>
          <label htmlFor="system-question" className="levelup-label">Ask System</label>
          <input id="system-question" className="levelup-input" maxLength={600} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What should I focus on this week?" />
          <button type="submit" disabled={Boolean(busy) || !question.trim()} className="levelup-button-secondary mt-3 w-full justify-center"><LevelUpIcon name={busy === "coach" ? "spark" : "compass"} className={busy === "coach" ? "h-5 w-5 animate-spin" : "h-5 w-5"} />{busy === "coach" ? "Consulting System…" : "Ask System"}</button>
        </form>
      </div>
      {error && <div className="mx-6 mb-6 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">{error}</div>}
      {coachAnswer && <div className="mx-6 mb-6 rounded-xl border border-violet-300/15 bg-violet-300/[0.05] p-5"><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">System recommendation</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{coachAnswer}</p></div>}
      {suggestions.length > 0 && <div className="grid gap-3 border-t border-slate-800 p-6 xl:grid-cols-2 sm:p-7">{suggestions.map((suggestion, index) => <AiSuggestionCard key={`${suggestion.title}-${index}`} suggestion={suggestion} onReview={() => setReviewing(suggestion)} />)}</div>}
      {reviewing && <AiMissionReviewDialog suggestion={reviewing} userId={userId} onClose={() => setReviewing(null)} onSaved={onMissionSaved} />}
    </section>
  );
}

