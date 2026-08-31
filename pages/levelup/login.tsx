import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";

import {
  getLevelUpSupabaseClient,
  hasLevelUpSupabaseConfig,
} from "../../lib/levelup/supabase";

export default function LevelUpLogin(): JSX.Element {
  const router = useRouter();
  const configured = hasLevelUpSupabaseConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    getLevelUpSupabaseClient()
      .auth.getClaims()
      .then(({ data }) => {
        if (active && data?.claims?.sub) {
          void router.replace("/levelup");
        }
      });
    return () => {
      active = false;
    };
  }, [configured, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: signInError } =
        await getLevelUpSupabaseClient().auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      if (signInError) throw signInError;

      const requestedPath =
        typeof router.query.next === "string" &&
        router.query.next.startsWith("/levelup")
          ? router.query.next
          : "/levelup";
      await router.replace(requestedPath);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Unable to sign in. Check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Enter Level Up | Rodney Mandap</title>
        <meta
          name="description"
          content="Private access to Rodney Mandap's Level Up growth dashboard."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="levelup-root levelup-grid relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <div className="levelup-orb levelup-orb-cyan -left-32 top-1/4" />
        <div className="levelup-orb levelup-orb-violet -right-40 bottom-0" />

        <section className="levelup-panel relative z-10 w-full max-w-md overflow-hidden p-7 sm:p-9">
          <div className="mb-8 flex items-center gap-4">
            <div className="levelup-mark" aria-hidden="true">
              <span>LV</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Private interface
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">
                Level Up
              </h1>
            </div>
          </div>

          <div className="mb-7 border-l-2 border-cyan-400/70 pl-4">
            <p className="text-sm leading-6 text-slate-300">
              Enter the command center. Complete missions, build momentum, and
              turn consistent action into measurable progress.
            </p>
          </div>

          {!configured ? (
            <div
              className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100"
              role="status"
            >
              Level Up is ready for its Supabase connection. Add the project URL
              and publishable key to enable secure sign-in.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="levelup-email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400"
                >
                  Authorized email
                </label>
                <input
                  id="levelup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="levelup-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="levelup-password"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400"
                >
                  Password
                </label>
                <input
                  id="levelup-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="levelup-input"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <p
                  className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="levelup-button-primary w-full"
              >
                {submitting ? "Validating access…" : "Enter command center"}
              </button>
            </form>
          )}

          <p className="mt-7 text-center text-xs leading-5 text-slate-500">
            Access is restricted to one allowlisted account. Registration is
            disabled for this application.
          </p>
        </section>
      </main>
    </>
  );
}
