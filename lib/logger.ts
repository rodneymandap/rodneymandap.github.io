type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel) {
  return LEVELS[level] >= LEVELS[DEFAULT_LEVEL];
}

type Meta = Record<string, unknown> | undefined;

async function sendToEndpoint(payload: Record<string, unknown>) {
  const endpoint = process.env.LOG_ENDPOINT;
  if (!endpoint) return;
  // Fire-and-forget to avoid slowing responses. If `fetch` is available, use it.
  try {
    if (typeof globalThis.fetch === "function") {
      void globalThis.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch (_) {
    // Ignore endpoint errors — logging must not throw.
  }
}

function format(level: LogLevel, message: string, meta?: Meta) {
  const obj: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  if (meta) obj.meta = meta;
  return obj;
}

const logger = {
  debug(message: string, meta?: Meta) {
    if (!shouldLog("debug")) return;
    const payload = format("debug", message, meta);
    try {
      console.debug(JSON.stringify(payload));
    } catch (_) {
      // ignore
    }
    void sendToEndpoint(payload);
  },
  info(message: string, meta?: Meta) {
    if (!shouldLog("info")) return;
    const payload = format("info", message, meta);
    try {
      console.info(JSON.stringify(payload));
    } catch (_) {}
    void sendToEndpoint(payload);
  },
  warn(message: string, meta?: Meta) {
    if (!shouldLog("warn")) return;
    const payload = format("warn", message, meta);
    try {
      console.warn(JSON.stringify(payload));
    } catch (_) {}
    void sendToEndpoint(payload);
  },
  error(message: string, meta?: Meta) {
    if (!shouldLog("error")) return;
    const payload = format("error", message, meta);
    try {
      console.error(JSON.stringify(payload));
    } catch (_) {}
    void sendToEndpoint(payload);
  },
};

export default logger;
