import { useEffect, useMemo, useState } from "react";

import { LEVELUP_QUEST_PRESETS } from "../../lib/levelup/presets";
import {
  LEVELUP_CADENCE_LABELS,
  LEVELUP_DIFFICULTY_XP,
  LEVELUP_STAT_LABELS,
  type LevelUpMissionPreset,
} from "../../lib/levelup/types";
import { LevelUpIcon } from "./LevelUpIcon";

export function PresetQuestSelector({
  existingPresetKeys,
  onAdd,
  onClose,
}: {
  existingPresetKeys: Set<string>;
  onAdd: (presets: LevelUpMissionPreset[]) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  const selectedPresets = useMemo(
    () =>
      LEVELUP_QUEST_PRESETS.filter((preset) => selectedKeys.has(preset.key)),
    [selectedKeys]
  );

  function togglePreset(key: string) {
    if (existingPresetKeys.has(key) || saving) return;
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function addSelected() {
    if (selectedPresets.length === 0 || saving) return;
    setSaving(true);
    setError("");
    try {
      await onAdd(selectedPresets);
      onClose();
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "The selected preset quests could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-selector-title"
    >
      <div className="levelup-panel max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-b-none p-5 sm:rounded-[1.25rem] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">
              Personal plan library
            </p>
            <h2
              id="preset-selector-title"
              className="mt-2 text-2xl font-black text-white"
            >
              Add quest presets
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Choose the habits and milestones that fit your current season.
              You can edit or archive them later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"
            aria-label="Close preset selector"
          >
            <LevelUpIcon name="close" />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {LEVELUP_QUEST_PRESETS.map((preset) => {
            const alreadyAdded = existingPresetKeys.has(preset.key);
            const selected = selectedKeys.has(preset.key);
            const { input } = preset;
            return (
              <button
                key={preset.key}
                type="button"
                disabled={alreadyAdded || saving}
                aria-pressed={selected}
                aria-label={
                  alreadyAdded
                    ? `${input.title} already added`
                    : `Select ${input.title}`
                }
                onClick={() => togglePreset(preset.key)}
                className={`rounded-xl border p-4 text-left transition ${
                  alreadyAdded
                    ? "cursor-not-allowed border-slate-800 bg-slate-950/35 opacity-55"
                    : selected
                    ? "border-cyan-300/50 bg-cyan-300/[0.08] ring-1 ring-cyan-300/20"
                    : "border-slate-800 bg-slate-950/20 hover:border-cyan-300/25 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="levelup-tag text-violet-200">
                    {preset.category}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      alreadyAdded
                        ? "border-slate-700 text-slate-500"
                        : selected
                        ? "border-cyan-300 bg-cyan-300 text-slate-950"
                        : "border-slate-700 text-transparent"
                    }`}
                  >
                    <LevelUpIcon name="check" className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-4 font-black text-white">{input.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {input.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="levelup-tag text-cyan-200">
                    {LEVELUP_CADENCE_LABELS[input.cadence]}
                  </span>
                  <span className="levelup-tag text-orange-200">
                    {input.difficulty} · {LEVELUP_DIFFICULTY_XP[input.difficulty]} XP
                  </span>
                  <span className="levelup-tag text-slate-300">
                    {LEVELUP_STAT_LABELS[input.stat_key]}
                  </span>
                </div>
                {alreadyAdded && (
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                    Already added
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            className="mt-5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-950/95 p-5 sm:-mx-8 sm:-mb-8 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="levelup-button-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void addSelected()}
            disabled={selectedPresets.length === 0 || saving}
            className="levelup-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LevelUpIcon
              name={saving ? "spark" : "plus"}
              className={`h-5 w-5 ${saving ? "animate-spin" : ""}`}
            />
            {saving
              ? "Adding quests…"
              : `Add ${selectedPresets.length} ${
                  selectedPresets.length === 1 ? "quest" : "quests"
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}
