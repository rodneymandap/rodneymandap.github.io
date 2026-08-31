import Image from "next/image";

import {
  getLevelUpHeroRank,
  type LevelUpHeroRank,
} from "../../lib/levelup/types";

export type LevelUpHeroState = "idle" | "focused" | "celebrate" | "comeback";

const rankLabels: Record<LevelUpHeroRank, string> = {
  initiate: "Initiate",
  vanguard: "Vanguard",
  ascendant: "Ascendant",
};

const stateCopy: Record<LevelUpHeroState, string> = {
  idle: "Choose the mission that moves your story forward.",
  focused: "Focus locked. One quest at a time.",
  celebrate: "Daily Clear. Momentum secured.",
  comeback: "A missed day is history. Today is your return.",
};

export function LevelUpHero({
  level,
  state,
}: {
  level: number;
  state: LevelUpHeroState;
}): JSX.Element {
  const rank = getLevelUpHeroRank(level);

  return (
    <article className={`levelup-hero levelup-hero-${rank} levelup-hero-${state}`}>
      <div className="levelup-hero-aura" aria-hidden="true" />
      <div className="levelup-hero-particles" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>
      <div className="levelup-hero-art" aria-hidden="true">
        <Image
          src="/levelup/aegis-hero.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 75vw, 360px"
        />
      </div>
      <div className="levelup-hero-copy">
        <div className="flex items-center gap-2">
          <span className="levelup-hero-rank">{rankLabels[rank]}</span>
          <span className="text-xs font-mono text-cyan-200/70">LV {level}</span>
        </div>
        <h2 className="mt-2 text-2xl font-black text-white">Aegis</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
          {stateCopy[state]}
        </p>
      </div>
    </article>
  );
}

