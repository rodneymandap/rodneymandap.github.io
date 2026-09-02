import { useRouter } from "next/router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  completeLevelUpMission,
  getLevelUpDashboard,
  setLevelUpDailyFocus,
  undoLevelUpMission,
} from "../../lib/levelup/supabase";
import type {
  LevelUpDashboard,
  LevelUpFeedback,
} from "../../lib/levelup/types";
import { isLevelUpComebackDay } from "../../lib/levelup/types";

type LevelUpContextValue = {
  dashboard: LevelUpDashboard | null;
  loading: boolean;
  error: string;
  busyMissionId: string | null;
  focusSaving: boolean;
  notice: LevelUpFeedback | null;
  refresh: () => Promise<void>;
  saveDailyFocus: (missionIds: string[]) => Promise<boolean>;
  completeMission: (missionId: string) => Promise<void>;
  undoMission: (missionId: string) => Promise<void>;
  clearNotice: () => void;
};

const LevelUpContext = createContext<LevelUpContextValue | null>(null);

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const { replace } = useRouter();
  const [dashboard, setDashboard] = useState<LevelUpDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyMissionId, setBusyMissionId] = useState<string | null>(null);
  const [focusSaving, setFocusSaving] = useState(false);
  const [notice, setNotice] = useState<LevelUpFeedback | null>(null);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const nextDashboard = await getLevelUpDashboard();
      setDashboard(nextDashboard);
      const penalty = nextDashboard.penalty_summary;
      if (penalty && penalty.count > 0) {
        const lostXp = Math.abs(penalty.xp_lost);
        const levelDropped = nextDashboard.progress.level < penalty.previous_level;
        setNotice({
          tone: "penalty",
          title: levelDropped
            ? `Rank reduced to Level ${nextDashboard.progress.level}`
            : "Daily route missed",
          message: `${penalty.count} unfinished ${penalty.count === 1 ? "quest cost" : "quests cost"} ${lostXp} XP.${levelDropped ? ` You dropped from Level ${penalty.previous_level}.` : ""}`,
          xp: -lostXp,
          level: nextDashboard.progress.level,
        });
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "The command center could not load.";
      setError(message);
      if (/jwt|session|refresh token|not authenticated/i.test(message)) {
        void replace("/levelup/login");
      }
    } finally {
      setLoading(false);
    }
  }, [replace]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeMission = useCallback(
    async (missionId: string) => {
      if (busyMissionId) return;
      setBusyMissionId(missionId);
      setNotice(null);
      const previousLevel = dashboard?.progress.level ?? 1;
      const previousFocus = dashboard?.daily_focus ?? [];
      const wasDailyClear =
        previousFocus.length > 0 && previousFocus.every((mission) => mission.completed);
      const wasComeback = dashboard
        ? isLevelUpComebackDay(
            dashboard.progress.last_active_date,
            dashboard.local_date
          )
        : false;

      try {
        const result = await completeLevelUpMission(missionId);
        setDashboard(result);
        const achievements = result.event.new_achievements ?? [];
        const leveledUp = result.progress.level > previousLevel;
        const dailyClear =
          !wasDailyClear &&
          (result.daily_focus ?? []).length > 0 &&
          (result.daily_focus ?? []).every((mission) => mission.completed);
        setNotice({
          tone: leveledUp ? "level" : "success",
          title: leveledUp
            ? `Level ${result.progress.level} reached`
            : dailyClear
            ? "Daily Clear"
            : wasComeback
            ? "Welcome back, hero"
            : "Mission complete",
          message: `+${result.event.xp_awarded ?? 0} XP awarded to ${
            result.event.stat_key ?? "your stats"
          }.`,
          xp: result.event.xp_awarded ?? 0,
          level: result.progress.level,
          dailyClear,
          comeback: wasComeback,
          achievements,
        });
      } catch (mutationError) {
        setNotice({
          tone: "error",
          title: "Mission unchanged",
          message:
            mutationError instanceof Error
              ? mutationError.message
              : "The completion could not be confirmed.",
        });
      } finally {
        setBusyMissionId(null);
      }
    },
    [busyMissionId, dashboard]
  );

  const saveDailyFocus = useCallback(async (missionIds: string[]) => {
    if (focusSaving) return false;
    setFocusSaving(true);
    setNotice(null);
    try {
      const result = await setLevelUpDailyFocus(missionIds);
      setDashboard(result);
      setNotice({
        tone: "success",
        title: "Daily briefing locked in",
        message: `${missionIds.length} focus ${missionIds.length === 1 ? "quest is" : "quests are"} ready.`,
      });
      return true;
    } catch (mutationError) {
      setNotice({
        tone: "error",
        title: "Briefing unchanged",
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Your focus quests could not be saved.",
      });
      return false;
    } finally {
      setFocusSaving(false);
    }
  }, [focusSaving]);

  const undoMission = useCallback(
    async (missionId: string) => {
      if (busyMissionId) return;
      setBusyMissionId(missionId);
      setNotice(null);
      try {
        const result = await undoLevelUpMission(missionId);
        setDashboard(result);
        setNotice({
          tone: "success",
          title: "Completion reversed",
          message: "Progress was recalculated from your confirmed history.",
        });
      } catch (mutationError) {
        setNotice({
          tone: "error",
          title: "Undo unavailable",
          message:
            mutationError instanceof Error
              ? mutationError.message
              : "The completion could not be reversed.",
        });
      } finally {
        setBusyMissionId(null);
      }
    },
    [busyMissionId]
  );

  const value = useMemo<LevelUpContextValue>(
    () => ({
      dashboard,
      loading,
      error,
      busyMissionId,
      focusSaving,
      notice,
      refresh,
      saveDailyFocus,
      completeMission,
      undoMission,
      clearNotice: () => setNotice(null),
    }),
    [
      dashboard,
      loading,
      error,
      busyMissionId,
      focusSaving,
      notice,
      refresh,
      saveDailyFocus,
      completeMission,
      undoMission,
    ]
  );

  return (
    <LevelUpContext.Provider value={value}>{children}</LevelUpContext.Provider>
  );
}

export function useLevelUp(): LevelUpContextValue {
  const context = useContext(LevelUpContext);
  if (!context) {
    throw new Error("useLevelUp must be used inside LevelUpProvider");
  }
  return context;
}
