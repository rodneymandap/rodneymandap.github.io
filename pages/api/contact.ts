import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

// In-memory rate limiting store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3; // Maximum 3 submissions per hour per IP

// Export for testing purposes
export const __test__ = {
  resetRateLimitStore: () => rateLimitStore.clear(),
};

// Clean up old entries periodically (only in non-test environment)
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Clean up every 5 minutes
}

type ContactFormData = {
  name: string;
  email: string;
  projectType?: string;
  message: string;
  honeypot?: string; // Spam protection field
};

type ErrorResponse = {
  error: string;
  details?: string;
};

type SuccessResponse = {
  success: boolean;
  message: string;
};

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0]
    : req.socket.remoteAddress || "unknown";
  return ip;
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  // Remove any HTML tags and trim whitespace
  return input.replace(/<[^>]*>/g, "").trim();
}

function validateFormData(
  data: ContactFormData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check honeypot (should be empty)
  if (data.honeypot && data.honeypot.length > 0) {
    return { valid: false, errors: ["Invalid submission"] };
  }

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Name is required");
  } else if (data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  } else if (data.name.trim().length > 100) {
    errors.push("Name must be less than 100 characters");
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!validateEmail(data.email)) {
    errors.push("Invalid email address");
  }

  // Validate message
  if (!data.message || data.message.trim().length === 0) {
    errors.push("Message is required");
  } else if (data.message.trim().length < 10) {
    errors.push("Message must be at least 10 characters");
  } else if (data.message.trim().length > 5000) {
    errors.push("Message must be less than 5000 characters");
  }

  // Validate project type (optional)
  if (data.projectType && data.projectType.trim().length > 200) {
    errors.push("Project type must be less than 200 characters");
  }

  return { valid: errors.length === 0, errors };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check rate limit
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        details: "Please try again later",
      });
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader("X-RateLimit-Remaining", rateLimit.remaining.toString());

    // Parse and validate request body
    const formData: ContactFormData = req.body;

    const validation = validateFormData(formData);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.errors.join(", "),
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(formData.name),
      email: sanitizeInput(formData.email),
      projectType: formData.projectType
        ? sanitizeInput(formData.projectType)
        : "Not specified",
      message: sanitizeInput(formData.message),
    };

    // Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return res.status(500).json({
        error: "Email service not configured",
        details: "Please contact the administrator",
      });
    }

    const resend = new Resend(resendApiKey);
    const recipientEmail = process.env.CONTACT_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

    if (!recipientEmail) {
      console.error("CONTACT_EMAIL is not configured");
      return res.status(500).json({
        error: "Email service not configured",
        details: "Please contact the administrator",
      });
    }

    // Send email notification to site owner
    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      replyTo: sanitizedData.email,
      subject: `New Contact Form Submission from ${sanitizedData.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${sanitizedData.name}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        <p><strong>Project Type:</strong> ${sanitizedData.projectType}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedData.message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p><small>Submitted from: ${clientIP}</small></p>
      `,
    });

    if (emailResult.error) {
      console.error("Failed to send email:", emailResult.error);
      return res.status(500).json({
        error: "Failed to send message",
        details: "Please try again later",
      });
    }

    // Optionally send auto-reply to submitter
    if (process.env.SEND_AUTO_REPLY === "true") {
      await resend.emails.send({
        from: fromEmail,
        to: sanitizedData.email,
        subject: "Thank you for reaching out!",
        html: `
          <h2>Thank you for your message!</h2>
          <p>Hi ${sanitizedData.name},</p>
          <p>I've received your message and will get back to you as soon as possible.</p>
          <p>Best regards,<br>Rodney Jan Mandap</p>
        `,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: "Please try again later",
    });
  }
}
