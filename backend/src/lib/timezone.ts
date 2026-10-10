import { env } from "../config/env.js";

function calendarDate(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const pick = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

export function startOfDay(instant: Date = new Date()): Date {
  const { year, month, day } = calendarDate(instant, env.TIMEZONE);
  return new Date(Date.UTC(year, month - 1, day));
}

export function endOfDay(instant: Date = new Date()): Date {
  const { year, month, day } = calendarDate(instant, env.TIMEZONE);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}
