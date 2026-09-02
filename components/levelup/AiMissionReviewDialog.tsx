import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { LevelUpAiQuestSuggestion } from "../../lib/levelup/ai/schemas";
import { suggestionToMissionInput } from "../../lib/levelup/ai/schemas";
import { createLevelUpMission } from "../../lib/levelup/supabase";
import {
  LEVELUP_CADENCE_LABELS,
  LEVELUP_DIFFICULTY_XP,
  LEVELUP_STAT_LABELS,
  type LevelUpCadence,
  type LevelUpDifficulty,
  type LevelUpMissionInput,
  type LevelUpStatKey,
} from "../../lib/levelup/types";
import { LevelUpIcon } from "./LevelUpIcon";

export function AiMissionReviewDialog({
  suggestion,
  userId,
  onClose,
  onSaved,
}: {
  suggestion: LevelUpAiQuestSuggestion;
  userId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<LevelUpMissionInput>(() =>
    suggestionToMissionInput(suggestion)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("Mission title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createLevelUpMission(userId, {
        ...form,
        title,
        description: form.description.trim(),
      });
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Mission could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  const dialog = (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="ai-mission-review-title">
      <div className="levelup-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-6 sm:rounded-[1.25rem] sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">✦ AI Generated · review required</p>
            <h2 id="ai-mission-review-title" className="mt-2 text-2xl font-black text-white">Confirm mission</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="levelup-icon-button" aria-label="Close AI mission review"><LevelUpIcon name="close" /></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div><label htmlFor="ai-mission-title" className="levelup-label">Mission title</label><input id="ai-mission-title" className="levelup-input" maxLength={120} autoFocus value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
          <div><label htmlFor="ai-mission-description" className="levelup-label">Briefing and objectives</label><textarea id="ai-mission-description" className="levelup-input min-h-[10rem] resize-y" maxLength={500} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label htmlFor="ai-mission-cadence" className="levelup-label">Cadence</label><select id="ai-mission-cadence" className="levelup-input" value={form.cadence} onChange={(event) => setForm((current) => ({ ...current, cadence: event.target.value as LevelUpCadence }))}>{(Object.keys(LEVELUP_CADENCE_LABELS) as LevelUpCadence[]).map((value) => <option key={value} value={value}>{LEVELUP_CADENCE_LABELS[value]}</option>)}</select></div>
            <div><label htmlFor="ai-mission-difficulty" className="levelup-label">Difficulty</label><select id="ai-mission-difficulty" className="levelup-input" value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as LevelUpDifficulty }))}>{(Object.keys(LEVELUP_DIFFICULTY_XP) as LevelUpDifficulty[]).map((value) => <option key={value} value={value}>{value} · {LEVELUP_DIFFICULTY_XP[value]} XP</option>)}</select></div>
            <div><label htmlFor="ai-mission-stat" className="levelup-label">Stat</label><select id="ai-mission-stat" className="levelup-input" value={form.stat_key} onChange={(event) => setForm((current) => ({ ...current, stat_key: event.target.value as LevelUpStatKey }))}>{(Object.keys(LEVELUP_STAT_LABELS) as LevelUpStatKey[]).map((value) => <option key={value} value={value}>{LEVELUP_STAT_LABELS[value]}</option>)}</select></div>
          </div>
          <p className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-sm text-slate-400">The database awards the canonical <strong className="text-cyan-200">{LEVELUP_DIFFICULTY_XP[form.difficulty]} XP</strong>. The AI cannot override this value.</p>
          {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="levelup-button-secondary">Cancel</button><button type="submit" disabled={saving} className="levelup-button-primary"><LevelUpIcon name={saving ? "spark" : "check"} className={saving ? "h-5 w-5 animate-spin" : "h-5 w-5"} />{saving ? "Saving mission…" : "Confirm and save"}</button></div>
        </form>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
