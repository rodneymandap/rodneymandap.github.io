import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import LevelUpSettingsPage from "../pages/levelup/settings";

const mockFetch = jest.fn();

jest.mock("../components/levelup/LevelUpShell", () => ({
  LevelUpShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../components/levelup/LevelUpProvider", () => ({
  useLevelUp: () => ({
    dashboard: {
      progress: { level: 3, total_xp: 250 },
    },
  }),
}));

describe("Level Up settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url === "/api/levelup/settings" && !options) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ model: "gemini-3.5-flash" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ model: "gemini-3.5-flash" }),
      });
    });
  });

  it("loads and saves the runtime model override", async () => {
    render(<LevelUpSettingsPage />);

    expect(await screen.findByDisplayValue("gemini-3.5-flash")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Gemini model"), {
      target: { value: "gemini-3.5-pro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save model" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/levelup/settings",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ model: "gemini-3.5-pro" }),
        })
      );
    });
  });
});

