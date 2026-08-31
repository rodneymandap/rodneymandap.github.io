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
  undoLevelUpMission,
} from "../../lib/levelup/supabase";
import type {
  LevelUpAchievementEvent,
  LevelUpDashboard,
} from "../../lib/levelup/types";

type LevelUpNotice = {
  tone: "success" | "level" | "error";
  title: string;
  message: string;
  achievements?: LevelUpAchievementEvent[];
};

type LevelUpContextValue = {
  dashboard: LevelUpDashboard | null;
  loading: boolean;
  error: string;
  busyMissionId: string | null;
  notice: LevelUpNotice | null;
  refresh: () => Promise<void>;
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
  const [notice, setNotice] = useState<LevelUpNotice | null>(null);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const nextDashboard = await getLevelUpDashboard();
      setDashboard(nextDashboard);
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

      try {
        const result = await completeLevelUpMission(missionId);
        setDashboard(result);
        const achievements = result.event.new_achievements ?? [];
        const leveledUp = result.progress.level > previousLevel;
        setNotice({
          tone: leveledUp ? "level" : "success",
          title: leveledUp
            ? `Level ${result.progress.level} reached`
            : "Mission complete",
          message: `+${result.event.xp_awarded ?? 0} XP awarded to ${
            result.event.stat_key ?? "your stats"
          }.`,
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
    [busyMissionId, dashboard?.progress.level]
  );

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
      notice,
      refresh,
      completeMission,
      undoMission,
      clearNotice: () => setNotice(null),
    }),
    [
      dashboard,
      loading,
      error,
      busyMissionId,
      notice,
      refresh,
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
