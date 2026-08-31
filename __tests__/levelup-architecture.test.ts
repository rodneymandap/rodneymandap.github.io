import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/202608310001_levelup.sql"),
  "utf8"
);
const focusMigration = fs.readFileSync(
  path.join(root, "supabase/migrations/202609010001_levelup_daily_focus.sql"),
  "utf8"
);
const presetMigration = fs.readFileSync(
  path.join(root, "supabase/migrations/202609010002_levelup_quest_presets.sql"),
  "utf8"
);
const middleware = fs.readFileSync(path.join(root, "middleware.ts"), "utf8");
const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));

describe("Level Up architecture safeguards", () => {
  it("protects only the required Level Up routes", () => {
    expect(middleware).toContain('"/levelup"');
    expect(middleware).toContain('"/levelup/quests/:path*"');
    expect(middleware).toContain('"/levelup/progress/:path*"');
    expect(middleware).toContain('"/levelup/achievements/:path*"');
    expect(middleware).not.toContain('"/levelup/login/:path*"');
    expect(fs.existsSync(path.join(root, "pages/system"))).toBe(false);
  });

  it("enables Fluid Compute without cron, storage, or memory overrides", () => {
    expect(vercel.fluid).toBe(true);
    expect(vercel.crons).toBeUndefined();
    expect(vercel.blob).toBeUndefined();
    Object.values(vercel.functions).forEach((definition: any) => {
      expect(definition.maxDuration).toBe(10);
      expect(definition.memory).toBeUndefined();
    });
  });

  it("contains the allowlist, RLS, recurrence uniqueness, and atomic RPC contract", () => {
    expect(migration).toContain("levelup_private.allowed_users");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("unique (user_id, mission_id, recurrence_key)");
    expect(migration).toContain("complete_levelup_mission");
    expect(migration).toContain("undo_levelup_mission");
    expect(migration).toContain("get_levelup_activity");
    expect(migration).toContain("for update");
    expect(migration).not.toMatch(/create\s+(extension|table|function).*cron/i);
  });

  it("persists an ordered daily focus through a validated atomic RPC", () => {
    expect(focusMigration).toContain("public.levelup_daily_focus");
    expect(focusMigration).toContain("primary key (user_id, focus_date, position)");
    expect(focusMigration).toContain("unique (user_id, focus_date, mission_id)");
    expect(focusMigration).toContain("set_levelup_daily_focus");
    expect(focusMigration).toContain("with ordinality");
    expect(focusMigration).toContain("mission.user_id = v_user_id");
    expect(focusMigration).toContain("mission.active");
    expect(focusMigration).toContain("enable row level security");
    expect(focusMigration).not.toMatch(/cron|service_role|background worker/i);
  });

  it("gives presets stable per-user identities without changing manual missions", () => {
    expect(presetMigration).toContain("add column if not exists preset_key text");
    expect(presetMigration).toContain("(user_id, preset_key)");
    expect(presetMigration).toContain("grant insert (preset_key)");
    expect(presetMigration).toContain("'preset_key', mission.preset_key");
    expect(presetMigration).not.toMatch(/cron|service_role|background worker/i);
  });
});
