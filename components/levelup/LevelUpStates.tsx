import Link from "next/link";
import { ReactNode } from "react";

import { LevelUpIcon } from "./LevelUpIcon";

export function LevelUpLoading({ label = "Synchronizing system" }: { label?: string }) {
  return (
    <div className="levelup-panel flex min-h-[18rem] flex-col items-center justify-center p-8 text-center" role="status">
      <div className="levelup-loader mb-5" aria-hidden="true" />
      <p className="font-bold text-white">{label}</p>
      <p className="mt-2 text-sm text-slate-500">Validating your latest confirmed progress.</p>
    </div>
  );
}

export function LevelUpError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="levelup-panel flex min-h-[18rem] flex-col items-center justify-center p-8 text-center" role="alert">
      <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200"><LevelUpIcon name="shield" className="h-8 w-8" /></div>
      <h2 className="text-xl font-black text-white">System connection interrupted</h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">{message}</p>
      <button type="button" onClick={onRetry} className="levelup-button-secondary mt-6">Retry connection</button>
    </div>
  );
}

export function LevelUpEmpty({
  icon = "compass",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="levelup-panel flex min-h-[15rem] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-cyan-200"><LevelUpIcon name={icon} className="h-8 w-8" /></div>
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action && <Link href={action.href} className="levelup-button-primary mt-6"><LevelUpIcon name="plus" />{action.label}</Link>}
    </div>
  );
}

export function LevelUpSection({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-black text-white">{title}</h2>{detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}</div>
      </div>
      {children}
    </section>
  );
}
