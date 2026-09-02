import Image from "next/image";
import type { CSSProperties } from "react";

import {
  getLevelUpHeroAppearance,
  getLevelUpHeroRank,
} from "../../lib/levelup/types";

export type LevelUpHeroState = "idle" | "focused" | "celebrate" | "comeback";

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
  const appearance = getLevelUpHeroAppearance(level);
  const style = {
    "--levelup-evolution": appearance.evolution,
    "--levelup-particles": appearance.particleCount,
  } as CSSProperties;

  return (
    <article
      className={`levelup-hero levelup-hero-${rank} levelup-hero-motion-${appearance.motion} ${appearance.raw ? "levelup-hero-raw" : ""} levelup-hero-${state}`}
      style={style}
      data-appearance-level={appearance.baseLevel}
      data-evolution={appearance.evolution}
    >
      <div className="levelup-hero-aura" aria-hidden="true" />
      <div className="levelup-hero-particles" aria-hidden="true">
        {Array.from({ length: appearance.particleCount }, (_, index) => <i key={index} />)}
      </div>
      <div className="levelup-hero-art" aria-hidden="true" data-testid="levelup-hero-art">
        <Image
          src={appearance.imageSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 75vw, 360px"
        />
      </div>
      <div className="levelup-hero-copy">
        <div className="flex items-center gap-2">
          <span className="levelup-hero-rank">{appearance.title}</span>
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
