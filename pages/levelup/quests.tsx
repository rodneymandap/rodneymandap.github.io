import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { LevelUpIcon } from "../../components/levelup/LevelUpIcon";
import { useLevelUp } from "../../components/levelup/LevelUpProvider";
import { LevelUpShell } from "../../components/levelup/LevelUpShell";
import {
  LevelUpEmpty,
  LevelUpError,
  LevelUpLoading,
} from "../../components/levelup/LevelUpStates";
import {
  createLevelUpMission,
  getLevelUpMissions,
  setLevelUpMissionArchived,
  updateLevelUpMission,
} from "../../lib/levelup/supabase";
import {
  LEVELUP_CADENCE_LABELS,
  LEVELUP_DIFFICULTY_XP,
  LEVELUP_STAT_LABELS,
  type LevelUpCadence,
  type LevelUpDifficulty,
  type LevelUpMission,
  type LevelUpMissionInput,
  type LevelUpStatKey,
} from "../../lib/levelup/types";

const emptyForm: LevelUpMissionInput = {
  title: "",
  description: "",
  cadence: "daily",
  difficulty: "normal",
  stat_key: "discipline",
};

type QuestFilter = "active" | "archived" | "all";

function MissionEditor({
  mission,
  saving,
  onClose,
  onSave,
}: {
  mission: LevelUpMission | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: LevelUpMissionInput) => Promise<void>;
}) {
  const [form, setForm] = useState<LevelUpMissionInput>(
    mission
      ? {
          title: mission.title,
          description: mission.description,
          cadence: mission.cadence,
          difficulty: mission.difficulty,
          stat_key: mission.stat_key,
        }
      : emptyForm
  );
  const [validationError, setValidationError] = useState("");

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
      setValidationError("Mission title is required.");
      return;
    }
    setValidationError("");
    await onSave({ ...form, title, description: form.description.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="mission-editor-title">
      <div className="levelup-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-6 sm:rounded-[1.25rem] sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Quest configuration</p>
            <h2 id="mission-editor-title" className="mt-2 text-2xl font-black text-white">{mission ? "Edit mission" : "Create mission"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white" aria-label="Close mission editor"><LevelUpIcon name="close" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="mission-title" className="levelup-label">Mission title</label>
            <input id="mission-title" className="levelup-input" maxLength={120} autoFocus value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Complete a focused workout" />
          </div>
          <div>
            <label htmlFor="mission-description" className="levelup-label">Briefing <span className="normal-case tracking-normal text-slate-600">(optional)</span></label>
            <textarea id="mission-description" className="levelup-input min-h-[7rem] resize-y" maxLength={500} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Define what completion means." />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="mission-cadence" className="levelup-label">Cadence</label>
              <select id="mission-cadence" className="levelup-input" value={form.cadence} onChange={(event) => setForm((current) => ({ ...current, cadence: event.target.value as LevelUpCadence }))}>
                {(Object.keys(LEVELUP_CADENCE_LABELS) as LevelUpCadence[]).map((cadence) => <option key={cadence} value={cadence}>{LEVELUP_CADENCE_LABELS[cadence]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="mission-difficulty" className="levelup-label">Difficulty</label>
              <select id="mission-difficulty" className="levelup-input" value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as LevelUpDifficulty }))}>
                {(Object.keys(LEVELUP_DIFFICULTY_XP) as LevelUpDifficulty[]).map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty[0].toUpperCase() + difficulty.slice(1)} · {LEVELUP_DIFFICULTY_XP[difficulty]} XP</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="mission-stat" className="levelup-label">Stat</label>
              <select id="mission-stat" className="levelup-input" value={form.stat_key} onChange={(event) => setForm((current) => ({ ...current, stat_key: event.target.value as LevelUpStatKey }))}>
                {(Object.keys(LEVELUP_STAT_LABELS) as LevelUpStatKey[]).map((stat) => <option key={stat} value={stat}>{LEVELUP_STAT_LABELS[stat]}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-sm text-slate-400">
            Completing this mission awards <strong className="text-cyan-200">{LEVELUP_DIFFICULTY_XP[form.difficulty]} XP</strong> to <strong className="text-white">{LEVELUP_STAT_LABELS[form.stat_key]}</strong>.
          </div>
          {validationError && <p className="text-sm text-rose-300" role="alert">{validationError}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="levelup-button-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="levelup-button-primary"><LevelUpIcon name={saving ? "spark" : mission ? "edit" : "plus"} className={`h-5 w-5 ${saving ? "animate-spin" : ""}`} />{saving ? "Saving mission…" : mission ? "Save changes" : "Create mission"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestsContent() {
  const { dashboard, loading, error, refresh } = useLevelUp();
  const [missions, setMissions] = useState<LevelUpMission[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [filter, setFilter] = useState<QuestFilter>("active");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<LevelUpMission | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyMissionId, setBusyMissionId] = useState<string | null>(null);

  const loadMissions = useCallback(async () => {
    setListError("");
    try {
      const rows = (await getLevelUpMissions(true)) as Omit<LevelUpMission, "completed">[];
      setMissions(
        rows.map((mission) => ({
          ...mission,
          completed:
            dashboard?.missions.find((active) => active.id === mission.id)?.completed ?? false,
        }))
      );
    } catch (loadError) {
      setListError(loadError instanceof Error ? loadError.message : "Quest log could not load.");
    } finally {
      setListLoading(false);
    }
  }, [dashboard?.missions]);

  useEffect(() => {
    if (dashboard) void loadMissions();
  }, [dashboard, loadMissions]);

  const visibleMissions = useMemo(
    () => missions.filter((mission) => filter === "all" || (filter === "active" ? mission.active : !mission.active)),
    [filter, missions]
  );

  function openCreate() {
    setEditingMission(null);
    setEditorOpen(true);
  }

  function openEdit(mission: LevelUpMission) {
    setEditingMission(mission);
    setEditorOpen(true);
  }

  async function saveMission(input: LevelUpMissionInput) {
    if (!dashboard) return;
    setSaving(true);
    setListError("");
    try {
      if (editingMission) await updateLevelUpMission(editingMission.id, input);
      else await createLevelUpMission(dashboard.profile.user_id, input);
      setEditorOpen(false);
      setEditingMission(null);
      await refresh();
      await loadMissions();
    } catch (saveError) {
      setListError(saveError instanceof Error ? saveError.message : "Mission could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchived(mission: LevelUpMission) {
    setBusyMissionId(mission.id);
    setListError("");
    try {
      await setLevelUpMissionArchived(mission.id, mission.active);
      await refresh();
      await loadMissions();
    } catch (archiveError) {
      setListError(archiveError instanceof Error ? archiveError.message : "Mission state could not be changed.");
    } finally {
      setBusyMissionId(null);
    }
  }

  if (loading) return <LevelUpLoading label="Opening quest log" />;
  if (error || !dashboard) return <LevelUpError message={error || "Profile unavailable."} onRetry={() => void refresh()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-cyan-200/10 bg-slate-900/45 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["active", "archived", "all"] as QuestFilter[]).map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${filter === value ? "bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20" : "text-slate-500 hover:text-white"}`}>{value}</button>
          ))}
        </div>
        <button type="button" onClick={openCreate} className="levelup-button-primary"><LevelUpIcon name="plus" />Create mission</button>
      </div>

      {listError && <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">{listError}</div>}

      {listLoading ? <LevelUpLoading label="Reading mission records" /> : visibleMissions.length === 0 ? (
        <LevelUpEmpty title={filter === "archived" ? "Archive is clear" : "No missions in this view"} message={filter === "active" ? "Create a daily, weekly, or one-time mission to begin earning XP." : "Archived missions remain here with their completion history intact."} />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visibleMissions.map((mission) => (
            <article key={mission.id} className={`levelup-panel p-5 ${!mission.active ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="levelup-tag text-cyan-200">{LEVELUP_CADENCE_LABELS[mission.cadence]}</span>
                    <span className="levelup-tag text-violet-200">{mission.difficulty} · {mission.xp_reward} XP</span>
                    {!mission.active && <span className="levelup-tag text-slate-400">Archived</span>}
                  </div>
                  <h2 className="mt-4 text-lg font-black text-white">{mission.title}</h2>
                  {mission.description && <p className="mt-2 text-sm leading-6 text-slate-500">{mission.description}</p>}
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"><LevelUpIcon name={mission.stat_key} className="h-4 w-4 text-cyan-300" />{LEVELUP_STAT_LABELS[mission.stat_key]}</p>
                </div>
                <div className="flex flex-none gap-2">
                  <button type="button" onClick={() => openEdit(mission)} disabled={!mission.active || busyMissionId === mission.id} className="levelup-icon-button" aria-label={`Edit ${mission.title}`}><LevelUpIcon name="edit" /></button>
                  <button type="button" onClick={() => void toggleArchived(mission)} disabled={busyMissionId === mission.id} className="levelup-icon-button" aria-label={`${mission.active ? "Archive" : "Restore"} ${mission.title}`}><LevelUpIcon name={busyMissionId === mission.id ? "spark" : mission.active ? "archive" : "restore"} className={busyMissionId === mission.id ? "animate-spin" : ""} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editorOpen && <MissionEditor mission={editingMission} saving={saving} onClose={() => { if (!saving) setEditorOpen(false); }} onSave={saveMission} />}
    </div>
  );
}

export default function LevelUpQuestsPage(): JSX.Element {
  return (
    <LevelUpShell title="Quest Log" subtitle="Create focused missions and assign every action a measurable reward.">
      <QuestsContent />
    </LevelUpShell>
  );
}
