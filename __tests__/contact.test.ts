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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should reject non-POST requests", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Method not allowed",
    });
  });

  it("should validate required fields", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "",
        email: "",
        message: "",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Name is required");
    expect(data.details).toContain("Email is required");
    expect(data.details).toContain("Message is required");
  });

  it("should validate email format", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "John Doe",
        email: "invalid-email",
        message: "This is a test message",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Invalid email address");
  });

  it("should validate message length", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
        message: "Short",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Message must be at least 10 characters");
  });

  it("should reject submissions with honeypot filled", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
        message: "This is a test message from a bot",
        honeypot: "spam content",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Validation failed");
    expect(data.details).toContain("Invalid submission");
  });

  it("should accept valid submission", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
        projectType: "Web Development",
        message: "This is a valid test message that is long enough",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe("Message sent successfully");
  });

  it("should sanitize HTML from inputs", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "John <script>alert('xss')</script> Doe",
        email: "john@example.com",
        message: "This is a test <b>message</b> with HTML tags",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });

  it("should return error when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
        message: "This is a valid test message",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe("Email service not configured");
  });

  it("should validate name length constraints", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "A",
        email: "john@example.com",
        message: "This is a valid test message",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.details).toContain("Name must be at least 2 characters");
  });

  it("should set rate limit headers", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
        message: "This is a valid test message",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()["x-ratelimit-limit"]).toBeDefined();
    expect(res._getHeaders()["x-ratelimit-remaining"]).toBeDefined();
  });
});
