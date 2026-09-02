import { FormEvent, useEffect, useState } from "react";

import { LEVELUP_GEMINI_MODELS } from "../../lib/levelup/ai/models";
import { useLevelUp } from "./LevelUpProvider";
import { LevelUpIcon } from "./LevelUpIcon";

export function LevelUpSettingsPanel() {
  const { dashboard } = useLevelUp();
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/levelup/settings")
      .then((response) => response.json())
      .then((data) => {
        if (active) setModel(data.model ?? "");
      })
      .catch(() => {
        if (active) setMessage("Unable to load model settings.");
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedLabel = model || "Use environment default";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/levelup/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model || null }),
      });
      if (!response.ok) throw new Error("Unable to save model setting.");
      setMessage("Saved. Future AI requests will use the selected model.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save model setting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="levelup-panel overflow-hidden" aria-labelledby="levelup-settings-title">
      <div className="border-b border-cyan-300/10 bg-cyan-300/[0.03] p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
            <LevelUpIcon name="shield" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Global settings</p>
            <h2 id="levelup-settings-title" className="mt-1 text-xl font-black text-white">AI model</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the Gemini model used by System assistant and quest generation.</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-7">
        <div>
          <label htmlFor="levelup-model" className="levelup-label">Gemini model</label>
          <select id="levelup-model" className="levelup-input" value={model} onChange={(event) => setModel(event.target.value)}>
            <option value="">Use environment default</option>
            {LEVELUP_GEMINI_MODELS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500">
          Selected model: {selectedLabel} · {dashboard ? `Level ${dashboard.progress.level}` : "Loading..."}
        </p>
        {message && <p className="text-sm text-slate-300">{message}</p>}
        <button type="submit" disabled={saving} className="levelup-button-primary">
          <LevelUpIcon name={saving ? "spark" : "edit"} className={saving ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
          {saving ? "Saving..." : "Save model"}
        </button>
      </form>
    </section>
  );
}
