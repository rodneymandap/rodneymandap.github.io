import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

import { getLevelUpSupabaseClient } from "../../lib/levelup/supabase";
import { LevelUpIcon, type LevelUpIconName } from "./LevelUpIcon";
import { LevelUpFeedback } from "./LevelUpFeedback";
import { LevelUpProvider, useLevelUp } from "./LevelUpProvider";

const navigation: Array<{
  href: string;
  label: string;
  icon: LevelUpIconName;
}> = [
  { href: "/levelup", label: "Dashboard", icon: "home" },
  { href: "/levelup/quests", label: "Quests", icon: "quests" },
  { href: "/levelup/progress", label: "Progress", icon: "progress" },
  {
    href: "/levelup/achievements",
    label: "Achievements",
    icon: "achievements",
  },
  {
    href: "/levelup/settings",
    label: "Settings",
    icon: "shield",
  },
];

type LevelUpShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

function ShellContent({ title, subtitle, children }: LevelUpShellProps) {
  const router = useRouter();
  const { dashboard, notice, clearNotice } = useLevelUp();

  async function signOut() {
    await getLevelUpSupabaseClient().auth.signOut();
    await router.replace("/levelup/login");
  }

  return (
    <div className="levelup-root levelup-grid min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-cyan-200/10 bg-slate-950/85 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="levelup-mark" aria-hidden="true"><span>LV</span></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Command center</p>
            <p className="mt-1 text-xl font-black text-white">Level Up</p>
          </div>
        </div>

        <nav aria-label="Level Up navigation" className="space-y-2">
          {navigation.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`levelup-nav-link ${active ? "levelup-nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <LevelUpIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="mb-4 rounded-xl border border-cyan-200/10 bg-cyan-300/[0.04] p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
              <span>System status</span>
              <span className="flex items-center gap-2 text-emerald-300"><i className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {dashboard ? `Level ${dashboard.progress.level} · ${dashboard.progress.total_xp} total XP` : "Synchronizing profile…"}
            </p>
          </div>
          <button type="button" onClick={signOut} className="levelup-nav-link w-full">
            <LevelUpIcon name="logout" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-cyan-200/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="levelup-mark !h-10 !w-10" aria-hidden="true"><span>LV</span></div>
            <div><p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Level Up</p><p className="font-bold text-white">{title}</p></div>
          </div>
          <button type="button" onClick={signOut} className="rounded-lg border border-slate-700 p-2 text-slate-400" aria-label="Sign out">
            <LevelUpIcon name="logout" />
          </button>
        </div>
      </header>

      <main className="relative min-h-screen px-4 pb-28 pt-7 sm:px-6 lg:ml-72 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 hidden items-end justify-between lg:flex">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Personal growth interface</p>
              <h1 className="text-4xl font-black tracking-tight text-white">{title}</h1>
              <p className="mt-2 text-slate-400">{subtitle}</p>
            </div>
            {dashboard && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                <LevelUpIcon name="shield" className="h-5 w-5 text-cyan-300" />
                <span>Asia/Manila · {dashboard.local_date}</span>
              </div>
            )}
          </div>
          {children}
        </div>
      </main>

      <nav aria-label="Level Up mobile navigation" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-cyan-200/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        {navigation.map((item) => {
          const active = router.pathname === item.href;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${active ? "bg-cyan-300/10 text-cyan-200" : "text-slate-500"}`}>
              <LevelUpIcon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {notice && <LevelUpFeedback feedback={notice} onDismiss={clearNotice} />}
    </div>
  );
}

export function LevelUpShell(props: LevelUpShellProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{props.title} | Level Up</title>
        <meta name="description" content={props.subtitle} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <LevelUpProvider>
        <ShellContent {...props} />
      </LevelUpProvider>
    </>
  );
}
