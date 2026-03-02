/**
 * 구조화된 로거
 *
 * Vercel에서 console.log → JSON으로 출력하면 Log Drains / Dashboard에서
 * 검색·필터링이 가능해진다.
 */

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    event,
    ts: new Date().toISOString(),
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
  } else if (level === "warn") {
    console.warn(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => log("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => log("error", event, data),
};
