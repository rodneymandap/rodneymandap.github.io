# Level Up setup

`/levelup` is a private, single-user personal growth application. It runs on the existing Next.js/Vercel deployment and stores all persistent progress in the existing Supabase Free project.

It does not use Vercel Cron, Vercel storage, Supabase Storage, Realtime, Edge Functions, polling, queues, or background workers. Optional, user-triggered System recommendations use the Gemini API through an authenticated Vercel server function.

## 1. Apply the database migration

1. Open the existing Supabase project.
2. Open **SQL Editor** and create a new query.
3. Copy and run the complete contents of all migrations in order:

   ```text
   supabase/migrations/202608310001_levelup.sql
   supabase/migrations/202609010001_levelup_daily_focus.sql
   supabase/migrations/202609010002_levelup_quest_presets.sql
   supabase/migrations/202609020001_levelup_missed_focus_penalties.sql
   ```

   Do not skip these SQL files. The Level Up XP totals, streaks, achievements, and missed-focus deductions all depend on the migration functions running in Supabase.

The migrations create only `levelup_*` public tables, a private Level Up allowlist, RLS policies, indexes, achievement definitions, and the transactional RPC functions used by the app. They do not change global Supabase Auth provider or signup settings.

## 2. Authorize the owner account

The authorized account must already exist under **Authentication → Users** and must have an email/password identity. Copy its user UUID and run this once in the SQL Editor:

```sql
insert into levelup_private.allowed_users (user_id)
values ('YOUR-SUPABASE-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

This allowlist is the Level Up authorization boundary. An authenticated Supabase user who is not in this table cannot initialize a Level Up profile, read Level Up records, create missions, or call progression functions.

To revoke access without deleting history:

```sql
delete from levelup_private.allowed_users
where user_id = 'YOUR-SUPABASE-AUTH-USER-UUID';
```

## 3. Configure application variables

Copy the Supabase project URL and **publishable key** from the project Connect dialog. Add these variables to `.env.local` for local development and to all applicable Vercel environments:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

These values are designed to be public. Do not add a Supabase secret key or legacy `service_role` key to this application; RLS and the allowlist enforce access.

Restart the local development server after changing environment variables.

### Optional System assistant

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and create a Gemini API key.
2. Add these server-only values to `.env.local`:

   ```env
   GEMINI_API_KEY=your_google_ai_studio_key
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

3. In Vercel, add `GEMINI_API_KEY` under **Project Settings → Environment Variables** for the environments where the assistant should work. Add `GEMINI_MODEL` only when overriding the default.

Never prefix the Gemini key with `NEXT_PUBLIC_`. The browser calls `/api/levelup/ai`; only that authenticated server route calls Google.

The default model is the stable `gemini-3.5-flash-lite`, selected for low latency, structured JSON output, and free-tier availability for lightweight text tasks. You can override it in `/levelup/settings` without redeploying. The saved choice falls back to `GEMINI_MODEL` when no runtime override exists. If you do change the environment variable, it still acts as the initial fallback for the app. The settings are stored in the `public.levelup_settings` table created by the Level Up migration. The selector currently includes the commonly available Gemini 2.0, 2.5, 3.0, and 3.5 model families.

## 4. Verify access and deployment

1. Visit `/levelup` without a session and confirm the redirect to `/levelup/login`.
2. Sign in with the allowlisted email/password account.
3. Open the Quest Log, choose two quests from **Add from presets**, and confirm both appear as editable active missions.
4. Reopen the preset library and confirm those quests are marked **Already added**, including after archiving one of them.
5. Complete one Easy daily mission, verify the 10 XP award, then use Undo and verify that progress returns to zero.
6. Choose one to three unfinished missions in the daily briefing, refresh, and confirm the ordered focus route remains for the current Manila date.
7. After a selected focus date passes, open Level Up and confirm each unfinished focused quest records one 25 XP deduction; repeat the load and confirm it is not duplicated.
8. Confirm `/levelup/quests`, `/levelup/progress`, and `/levelup/achievements` load while authenticated.
9. Sign out and confirm all four private routes redirect to login.
10. After deploying, open the Vercel project’s Resources/Functions view and confirm Fluid Compute is active.
11. With `GEMINI_API_KEY` configured, generate a quest, edit its briefing, and confirm it before saving. Remove the key temporarily and verify that the friendly unavailable message appears while normal quest actions continue working.

`vercel.json` explicitly enables Fluid Compute and preserves the existing 10-second maximum for each portfolio API function. Level Up mission reads and writes continue to go directly to Supabase. The narrow AI function verifies the existing Supabase session and allowlist before sending a request to Gemini.

## System assistant architecture and security

```text
Authenticated browser → /api/levelup/ai → RLS-protected LevelUp context → Gemini
```

- The route accepts only quest generation, daily missions, weekly review, and focused coaching.
- Supabase session claims and the LevelUp allowlist are verified before an AI request. No service-role key is used.
- Prompts contain only bounded level, XP, streak, stat, active-mission, and recent-completion context. Authentication data and secrets are never included.
- Stored and user-entered text is explicitly treated as untrusted prompt content. The System prompt rejects embedded override instructions and secret-disclosure requests.
- Requests are limited to 4 KB, checked for same-origin use, subject to a best-effort per-instance user cooldown, and given an eight-second provider timeout.
- Gemini returns structured JSON which is validated with Zod. Invalid, blocked, timed-out, and quota-limited responses are discarded.
- Gemini cannot save missions or award XP. The user must review generated content, and the existing database-generated mapping remains authoritative: Easy 10, Normal 25, Hard 50, Epic 100 XP.
- Generated suggestions and coach replies are ephemeral. Only a mission explicitly confirmed by the user is persisted.

## Free-tier behavior

- Normal single-user use should remain far below the Vercel Hobby and Supabase Free quotas.
- Gemini is called only after an explicit user action; loading `/levelup` never consumes AI quota.
- Google currently lists free-of-charge input and output for the default model on the Gemini Developer API free tier. Free-tier data may be used to improve Google products; review Google’s current terms before sending sensitive personal notes.
- Gemini rate limits are applied per Google Cloud project across API keys and may use requests-per-minute, tokens-per-minute, and requests-per-day dimensions. Actual limits and capacity vary by model, project, and account status; view the current values in [Google AI Studio](https://aistudio.google.com/rate-limit) instead of relying on historical numbers. Daily request quotas reset according to Google’s documented Pacific-time schedule.
- Quota exhaustion, timeout, network failure, missing configuration, safety rejection, and malformed responses leave all progression data and manual features unaffected.
- Daily and weekly recurrences are derived from the Asia/Manila date. No reset job exists.
- Daily focus rows use the same Manila date and are replaced atomically through `set_levelup_daily_focus`.
- On the next authenticated Level Up load after a focus date ends, each unfinished focus quest receives one recorded 25 XP deduction. This is idempotent, can lower a level, and never reduces total XP below zero.
- The comeback quest is derived from the last confirmed active date. It awards no bonus XP and never preserves or rewrites a streak.
- The Aegis hero and its effects are static local assets plus CSS animation. No runtime image service is called.
- Streaks and achievements are recalculated from confirmed completion history. No scheduled analytics job exists.
- Activity history is requested 20 records at a time.
- A Vercel outage cannot erase Level Up data because all state is stored in Supabase.
- Supabase Free projects may pause after one week without activity and do not include automatic backups. Export important data manually when an additional backup is desired.

## Troubleshooting

- **“This account is not authorized for Level Up”**: add the signed-in user UUID to `levelup_private.allowed_users`.
- **Login page shows a setup message**: configure both `NEXT_PUBLIC_SUPABASE_*` variables and restart/redeploy.
- **A completion reports a duplicate**: the mission is already complete for the current daily, ISO-weekly, or one-time recurrence key.
- **Database is read-only**: check Supabase database usage. Free projects enter read-only mode after exceeding the database-size quota.
- **“AI assistance is temporarily unavailable”**: confirm `GEMINI_API_KEY` exists in the current local or Vercel environment, then check Gemini API status and the project’s active rate limits in Google AI Studio.
