/**
 * @jest-environment node
 */
import { createMocks } from "node-mocks-http";
import type { NextApiRequest, NextApiResponse } from "next";
import handler, { __test__ } from "../pages/api/contact";

// Mock Resend
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: "mock-email-id", error: null }),
      },
    })),
  };
});

describe("/api/contact", () => {
  beforeEach(() => {
    // Set required environment variables
    process.env.RESEND_API_KEY = "test-api-key";
    process.env.CONTACT_EMAIL = "test@example.com";
    process.env.FROM_EMAIL = "sender@example.com";

    // Reset rate limit store before each test
    __test__.resetRateLimitStore();
  });

  // Helper to create mocked request/response with sensible defaults
  const makeRequest = (
    overrides: Record<string, unknown> = {},
    method = "POST"
  ) => {
    const defaultBody = {
      name: "John Doe",
      email: "john@example.com",
      message: "This is a valid test message",
    };

    const body = { ...(defaultBody as Record<string, unknown>), ...(overrides || {}) };

    return createMocks<NextApiRequest, NextApiResponse>({
      method,
      body,
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should reject non-POST requests", async () => {
    const { req, res } = makeRequest({}, "GET");

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Method not allowed");
    expect(data.details).toBe("This endpoint only accepts POST requests");
  });

  it("should validate required fields", async () => {
    const { req, res } = makeRequest({ name: "", email: "", message: "" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Name is required");
    expect(data.details).toContain("Email is required");
    expect(data.details).toContain("Message is required");
  });

  it("should validate email format", async () => {
    const { req, res } = makeRequest({ email: "invalid-email", message: "This is a test message" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Invalid email address");
  });

  it("should validate message length", async () => {
    const { req, res } = makeRequest({ message: "Short" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Message must be at least 10 characters");
  });

  it("should reject submissions with honeypot filled", async () => {
    const { req, res } = makeRequest({ message: "This is a test message from a bot", honeypot: "spam content" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Invalid submission");
  });

  it("should accept valid submission", async () => {
    const { req, res } = makeRequest({ projectType: "Web Development", message: "This is a valid test message that is long enough" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe("Message sent successfully");
  });

  it("should sanitize HTML from inputs", async () => {
    const { req, res } = makeRequest({ name: "John <script>alert('xss')</script> Doe", message: "This is a test <b>message</b> with HTML tags" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });

  it("should return error when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const { req, res } = makeRequest();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Email service not configured");
  });

  it("should validate name length constraints", async () => {
    const { req, res } = makeRequest({ name: "A" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.details).toContain("Name must be at least 2 characters");
  });

  it("should set rate limit headers", async () => {
    const { req, res } = makeRequest();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()["x-ratelimit-limit"]).toBeDefined();
    expect(res._getHeaders()["x-ratelimit-remaining"]).toBeDefined();
  });

  it("should enforce rate limiting after max requests", async () => {
    // Make 3 successful requests
    for (let i = 0; i < 3; i++) {
      const { req, res } = makeRequest();
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
    }

    // 4th request should be rate limited
    const { req, res } = makeRequest();
    await handler(req, res);

    expect(res._getStatusCode()).toBe(429);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Too many requests");
    expect(data.details).toContain("Maximum 3 submissions per hour");
  });

  it("should return error when CONTACT_EMAIL is not set", async () => {
    delete process.env.CONTACT_EMAIL;
    const { req, res } = makeRequest();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Email service not configured");
  });

  it("should validate name maximum length", async () => {
    const longName = "a".repeat(101);
    const { req, res } = makeRequest({ name: longName });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.details).toContain("Name must be less than 100 characters");
  });

  it("should validate message maximum length", async () => {
    const longMessage = "a".repeat(5001);
    const { req, res } = makeRequest({ message: longMessage });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.details).toContain("Message must be less than 5000 characters");
  });

  it("should validate project type maximum length", async () => {
    const longProjectType = "a".repeat(201);
    const { req, res } = makeRequest({ 
      projectType: longProjectType,
      message: "This is a valid test message" 
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.details).toContain("Project type must be less than 200 characters");
  });

  it("should handle email sending failure", async () => {
    // Mock Resend to return an error
    const { Resend } = require("resend");
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ 
          error: { message: "Email sending failed" }, 
          data: null 
        }),
      },
    }));

    const { req, res } = makeRequest();
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Failed to send message");
    expect(data.details).toContain("Email service error");
  });

  it("should send auto-reply when SEND_AUTO_REPLY is enabled", async () => {
    process.env.SEND_AUTO_REPLY = "true";
    const { Resend } = require("resend");
    const mockSend = jest.fn()
      .mockResolvedValueOnce({ id: "mock-email-id", error: null })
      .mockResolvedValueOnce({ id: "mock-autoreply-id", error: null });

    Resend.mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    }));

    const { req, res } = makeRequest();
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(2); // Main email + auto-reply
    
    // Verify auto-reply was sent to submitter
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "john@example.com",
        subject: "Thank you for reaching out!",
      })
    );

    delete process.env.SEND_AUTO_REPLY;
  });

  it("should handle X-Forwarded-For header with multiple IPs", async () => {
    const { Resend } = require("resend");
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: "mock-email-id", error: null }),
      },
    }));

    const { req, res } = makeRequest();
    req.headers["x-forwarded-for"] = "203.0.113.1, 198.51.100.1, 192.0.2.1";

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    // First IP (203.0.113.1) should be used for rate limiting
  });

  it("should handle X-Forwarded-For as array", async () => {
    const { Resend } = require("resend");
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: "mock-email-id", error: null }),
      },
    }));

    const { req, res } = makeRequest();
    req.headers["x-forwarded-for"] = ["203.0.113.1, 198.51.100.1"];

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
  });

  it("should handle whitespace-only name", async () => {
    const { req, res } = makeRequest({ name: "   " });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.details).toContain("Name is required");
  });

  it("should preserve newlines in message", async () => {
    const { Resend } = require("resend");
    const mockSend = jest.fn().mockResolvedValue({ id: "mock-email-id", error: null });

    Resend.mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    }));

    const { req, res } = makeRequest({ 
      message: "Line 1\nLine 2\nLine 3" 
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    // Verify newlines are converted to <br> in email HTML
    const emailCall = mockSend.mock.calls[0][0];
    expect(emailCall.html).toContain("Line 1<br>Line 2<br>Line 3");
  });

  it("should handle unexpected errors gracefully", async () => {
    const { Resend } = require("resend");
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockRejectedValue(new Error("Network error")),
      },
    }));

    const { req, res } = makeRequest();
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Internal server error");
    expect(data.details).toContain("An unexpected error occurred");
  });

  it("should validate various email formats", async () => {
    const { Resend } = require("resend");
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: "mock-email-id", error: null }),
      },
    }));

    const validEmails = [
      "test@example.com",
      "user.name@example.co.uk",
      "user+tag@example.com",
      "user_name@example-domain.com",
    ];

    for (const email of validEmails) {
      __test__.resetRateLimitStore();
      const { req, res } = makeRequest({ email });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
    }

    const invalidEmails = [
      "notanemail",
      "@example.com",
      "user@",
      "user @example.com",
      "user@.com",
    ];

    for (const email of invalidEmails) {
      __test__.resetRateLimitStore();
      const { req, res } = makeRequest({ email });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(400);
    }
  });
});
