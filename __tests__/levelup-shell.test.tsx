import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { LevelUpShell } from "../components/levelup/LevelUpShell";

const mockReplace = jest.fn();
const mockSignOut = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ pathname: "/levelup", replace: mockReplace }) }));
jest.mock("../components/levelup/LevelUpProvider", () => ({
  LevelUpProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLevelUp: () => ({
    dashboard: { local_date: "2026-08-31", progress: { level: 3, total_xp: 350 } },
    notice: null,
    clearNotice: jest.fn(),
  }),
}));
jest.mock("../lib/levelup/supabase", () => ({ getLevelUpSupabaseClient: () => ({ auth: { signOut: mockSignOut } }) }));

describe("LevelUpShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
    mockReplace.mockResolvedValue(true);
  });

  it("renders private navigation without linking from the portfolio", () => {
    render(<LevelUpShell title="Command Center" subtitle="Daily progress"><p>Secure content</p></LevelUpShell>);
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quests").length).toBeGreaterThan(0);
    expect(screen.getByText("Secure content")).toBeInTheDocument();
    expect(screen.queryByText("Portfolio")).not.toBeInTheDocument();
  });

  it("signs out and returns to the private login", async () => {
    render(<LevelUpShell title="Command Center" subtitle="Daily progress"><p>Secure content</p></LevelUpShell>);
    fireEvent.click(screen.getAllByRole("button", { name: "Sign out" })[0]);
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith("/levelup/login");
  });
});
