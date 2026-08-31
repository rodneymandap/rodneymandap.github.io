import { useEffect, useMemo, useRef, useState } from "react";

import type { LevelUpMission } from "../../lib/levelup/types";
import { LevelUpIcon } from "./LevelUpIcon";

export function DailyBriefing({
  open,
  missions,
  initialMissionIds,
  saving,
  onSave,
  onPostpone,
  onClose,
}: {
  open: boolean;
  missions: LevelUpMission[];
  initialMissionIds: string[];
  saving: boolean;
  onSave: (missionIds: string[]) => Promise<boolean>;
  onPostpone: () => void;
  onClose: () => void;
}): JSX.Element | null {
  const [selected, setSelected] = useState<string[]>(initialMissionIds);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(initialMissionIds);
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || saving) return;
      if (initialMissionIds.length > 0) onClose();
      else onPostpone();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [initialMissionIds, onClose, onPostpone, open, saving]);

  const missionMap = useMemo(
    () => new Map(missions.map((mission) => [mission.id, mission])),
    [missions]
  );

  if (!open) return null;

  function toggle(missionId: string) {
    setSelected((current) => {
      if (current.includes(missionId)) {
        return current.filter((id) => id !== missionId);
      }
      return current.length < 3 ? [...current, missionId] : current;
    });
  }

  function move(index: number, direction: -1 | 1) {
    setSelected((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    if (selected.length === 0 || saving) return;
    if (await onSave(selected)) onClose();
  }

  return (
    <div className="levelup-briefing-backdrop" role="presentation">
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="levelup-briefing"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-briefing-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Daily briefing
            </p>
            <h2 id="daily-briefing-title" className="mt-2 text-3xl font-black text-white">
              Choose your top three
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Pick one to three quests. The order becomes today&apos;s route.
            </p>
          </div>
          {initialMissionIds.length > 0 && (
            <button type="button" onClick={onClose} className="levelup-icon-button" aria-label="Close daily briefing">
              <LevelUpIcon name="close" />
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {missions.map((mission) => {
            const active = selected.includes(mission.id);
            return (
              <button
                type="button"
                key={mission.id}
                onClick={() => toggle(mission.id)}
                aria-pressed={active}
                disabled={!active && selected.length >= 3}
                className={`levelup-briefing-choice ${active ? "levelup-briefing-choice-active" : ""}`}
              >
                <span className="min-w-0 text-left">
                  <strong className="block truncate text-sm text-white">{mission.title}</strong>
                  <span className="mt-1 block text-xs text-slate-500">{mission.xp_reward} XP · {mission.cadence}</span>
                </span>
                <span className="font-mono text-xs text-cyan-200">{active ? selected.indexOf(mission.id) + 1 : "+"}</span>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="mt-6 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quest order</p>
            {selected.map((missionId, index) => (
              <div key={missionId} className="flex items-center gap-2 py-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-cyan-300/10 font-mono text-xs text-cyan-200">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-300">{missionMap.get(missionId)?.title}</span>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="levelup-order-button" aria-label={`Move ${missionMap.get(missionId)?.title} earlier`}>↑</button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === selected.length - 1} className="levelup-order-button" aria-label={`Move ${missionMap.get(missionId)?.title} later`}>↓</button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {initialMissionIds.length === 0 ? (
            <button type="button" onClick={onPostpone} disabled={saving} className="levelup-button-secondary">Not now</button>
          ) : <span />}
          <button type="button" onClick={() => void save()} disabled={saving || selected.length === 0} className="levelup-button-primary">
            <LevelUpIcon name={saving ? "spark" : "quests"} className={saving ? "animate-spin" : ""} />
            {saving ? "Locking route…" : `Start ${selected.length || ""} ${selected.length === 1 ? "quest" : "quests"}`}
          </button>
        </div>
      </section>
    </div>
  );
}
