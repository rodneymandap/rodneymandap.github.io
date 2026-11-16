import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../pages/index";

jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const originalFetch = global.fetch;
const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

function response(ok: boolean, data: object): Response {
  return { ok, json: async () => data } as Response;
}

function fillContactForm(message = "I have a project to discuss."): void {
  fireEvent.change(screen.getByLabelText(/^Name/), {
    target: { value: "Alex Client" },
  });
  fireEvent.change(screen.getByLabelText(/^Email/), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/What would you like to discuss/), {
    target: { value: "Automation" },
  });
  fireEvent.change(screen.getByLabelText(/^Message/), {
    target: { value: message },
  });
}

describe("Portfolio home", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("introduces the work and keeps the existing experience and portrait", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Software & automation, built to work.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /a software engineer building web applications and automating network operations and other manual processes into end-to-end workflows/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/automation platforms/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Software Engineer Building Applications" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/a Python and Django engineer/i)
    ).not.toBeInTheDocument();
    expect(screen.getByAltText("Rodney Jan Mandap")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Rodney Jan Mandap's GitHub profile" })
    ).toHaveAttribute("href", "https://github.com/rodneymandap");
    expect(screen.getByText(`${new Date().getFullYear() - 2017}+`)).toBeInTheDocument();
    expect(screen.getByText("Years Experience")).toBeInTheDocument();
    expect(screen.queryByText("Available for Projects")).not.toBeInTheDocument();
    expect(screen.queryByText("Primary Framework")).not.toBeInTheDocument();
  });

  it("links the work index and navigation to the relevant sections", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: /Web applications.*Workflow tools/i })
    ).toHaveAttribute("href", "#about");
    expect(
      screen.getByRole("link", { name: /Automation.*Network automation & other workflows/i })
    ).toHaveAttribute("href", "#automation-scripting");
    expect(
      screen.getByRole("link", { name: /Backend systems.*APIs/i })
    ).toHaveAttribute("href", "#backend-development");
    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(navigation).getByRole("link", { name: "Skills" })).toHaveAttribute(
      "href",
      "#skills"
    );
    expect(within(navigation).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "#contact"
    );
  });

  it("opens the mobile menu and closes it after following a link", () => {
    render(<Home />);

    const toggle = screen.getByRole("button", { name: "Open navigation menu" });
    const menu = document.getElementById("mobile-navigation");
    expect(menu).toHaveAttribute("hidden");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(menu).not.toHaveAttribute("hidden");

    fireEvent.click(within(menu as HTMLElement).getByRole("link", { name: "About" }));
    expect(menu).toHaveAttribute("hidden");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("retains skills, credentials, and their real external links", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Skills & Technologies" })).toBeInTheDocument();
    expect(screen.getAllByText("Python").length).toBeGreaterThan(0);
    expect(screen.getByText("Django")).toBeInTheDocument();
    expect(screen.queryByText("94%")).not.toBeInTheDocument();
    expect(screen.getByText("Django REST Framework")).toBeInTheDocument();
    expect(screen.getByText("ID: AZ-900")).toBeInTheDocument();
    expect(screen.getByText("ID: AZ-104")).toBeInTheDocument();

    const certificate = screen.getByRole("link", {
      name: "View Azure Fundamentals certificate (opens in a new tab)",
    });
    expect(certificate).toHaveAttribute(
      "href",
      "https://www.credly.com/badges/0173669e-f050-424d-999a-f661555905a2/public_url"
    );
    expect(certificate).toHaveAttribute("target", "_blank");
    expect(certificate).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/rodneymandap"
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/rjmandap/"
    );
  });

  it("keeps the existing search and social metadata", () => {
    render(<Home />);

    expect(screen.getByText("Rodney Jan Mandap | Freelance Software Engineer")).toBeInTheDocument();
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://rodneymandap.github.io"
    );
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Rodney Jan Mandap | Freelance Software Engineer"
    );
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      expect.stringContaining("network automation and broader end-to-end workflow automation")
    );
    expect(document.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
  });

  it("submits the contact form, disables it while sending, and clears it on success", async () => {
    let resolveRequest: (value: Response) => void = () => {
      throw new Error("Request was not started");
    };
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    render(<Home />);
    fillContactForm();

    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alex Client",
        email: "alex@example.com",
        projectType: "Automation",
        message: "I have a project to discuss.",
        honeypot: "",
      }),
    });
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    expect(screen.getByLabelText(/^Name/)).toBeDisabled();

    await act(async () => {
      resolveRequest(response(true, { success: true }));
    });

    expect(screen.getByRole("status")).toHaveTextContent("Message sent successfully");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("");
    expect(screen.getByLabelText(/^Message/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Send Message" })).toBeEnabled();
  });

  it("keeps the message and announces a server error", async () => {
    fetchMock.mockResolvedValue(
      response(false, { error: "Too many requests", details: "Please try again later." })
    );
    render(<Home />);
    fillContactForm();

    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again later.");
    expect(screen.getByLabelText(/^Message/)).toHaveValue("I have a project to discuss.");
    expect(screen.getByRole("button", { name: "Send Message" })).toBeEnabled();
  });

  it("reports network failures without losing the message", async () => {
    const logError = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("Network unavailable"));
    render(<Home />);
    fillContactForm();

    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An error occurred. Please try again later."
    );
    expect(screen.getByLabelText(/^Message/)).toHaveValue("I have a project to discuss.");
    expect(logError).toHaveBeenCalled();
    logError.mockRestore();
  });

  it("rejects a message shorter than ten characters before submitting", () => {
    render(<Home />);
    fillContactForm("Too short");

    fireEvent.submit(screen.getByRole("form", { name: "Contact form" }));

    expect(screen.getByRole("alert")).toHaveTextContent("at least 10 characters");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
