import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import LevelUpLogin from "../pages/levelup/login";

const mockReplace = jest.fn();
const mockSignIn = jest.fn();
const mockGetClaims = jest.fn();
let mockConfigured = true;

jest.mock("next/router", () => ({
  useRouter: () => ({ replace: mockReplace, query: {} }),
}));

jest.mock("../lib/levelup/supabase", () => ({
  hasLevelUpSupabaseConfig: () => mockConfigured,
  getLevelUpSupabaseClient: () => ({
    auth: { signInWithPassword: mockSignIn, getClaims: mockGetClaims },
  }),
}));

describe("Level Up login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigured = true;
    mockGetClaims.mockResolvedValue({ data: null });
    mockSignIn.mockResolvedValue({ error: null });
    mockReplace.mockResolvedValue(true);
  });

  it("shows only the private email/password sign-in flow", () => {
    render(<LevelUpLogin />);
    expect(screen.getByRole("heading", { name: "Level Up" })).toBeInTheDocument();
    expect(screen.getByLabelText("Authorized email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByText(/sign up|register/i)).not.toBeInTheDocument();
  });

  it("signs in and opens the command center", async () => {
    render(<LevelUpLogin />);
    fireEvent.change(screen.getByLabelText("Authorized email"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enter command center" }));

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "owner@example.com",
        password: "secret-password",
      })
    );
    expect(mockReplace).toHaveBeenCalledWith("/levelup");
  });

  it("keeps the form visible when credentials are rejected", async () => {
    mockSignIn.mockResolvedValue({ error: new Error("Invalid login credentials") });
    render(<LevelUpLogin />);
    fireEvent.change(screen.getByLabelText("Authorized email"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Enter command center" }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid login credentials");
  });

  it("shows a safe setup state when environment variables are absent", () => {
    mockConfigured = false;
    render(<LevelUpLogin />);
    expect(screen.getByText(/ready for its Supabase connection/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enter command center" })).not.toBeInTheDocument();
  });
});
