export type LevelUpIconName =
  | "home"
  | "quests"
  | "progress"
  | "achievements"
  | "logout"
  | "flame"
  | "bolt"
  | "plus"
  | "edit"
  | "archive"
  | "restore"
  | "check"
  | "undo"
  | "close"
  | "shield"
  | "spark"
  | "target"
  | "crown"
  | "level"
  | "strength"
  | "vitality"
  | "intellect"
  | "discipline"
  | "compass";

type LevelUpIconProps = {
  name: LevelUpIconName | string;
  className?: string;
};

export function LevelUpIcon({
  name,
  className = "h-5 w-5",
}: LevelUpIconProps): JSX.Element {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, JSX.Element> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    quests: <><path d="M8 6h11M8 12h11M8 18h11" /><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" /></>,
    progress: <><path d="M4 19V9M10 19V5M16 19v-8M22 19V3" /><path d="M2 19h21" /></>,
    achievements: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9" /><path d="m10 8 1.3 1.3L14 6.5" /></>,
    logout: <><path d="M10 17v3H4V4h6v3M15 8l4 4-4 4M8 12h11" /></>,
    flame: <path d="M12 22c4 0 7-3 7-7 0-5-4-8-6-12 0 4-3 6-4 8-1-1-2-2-2-4-2 3-3 5-3 8 0 4 3 7 8 7Z" />,
    bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    archive: <><path d="M4 7h16v13H4Z" /><path d="M3 3h18v4H3ZM9 11h6" /></>,
    restore: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    undo: <><path d="m9 7-5 5 5 5" /><path d="M20 17a7 7 0 0 0-7-7H4" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8Z" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    crown: <><path d="m3 7 4 4 5-7 5 7 4-4-2 11H5Z" /><path d="M5 21h14" /></>,
    level: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m8 13 4-4 4 4" /></>,
    strength: <><path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" /></>,
    vitality: <><path d="M20.8 8.5c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11A4.8 4.8 0 0 1 12 5.8a4.8 4.8 0 0 1 8.8 2.7Z" /></>,
    intellect: <><path d="M9 18h6M10 22h4" /><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5C14.5 16.2 14 17 14 18h-4c0-1-.5-1.8-1.5-2.5Z" /></>,
    discipline: <><path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6Z" /><path d="M12 7v5l3 2" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...common}
    >
      {paths[name] ?? paths.spark}
    </svg>
  );
}
