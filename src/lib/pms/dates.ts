/**
 * Pure date helpers — no Date library, ISO strings only.
 */

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z").getTime();
  const b = new Date(toIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

export function rangeDates(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const n = diffDays(startIso, endIso);
  for (let i = 0; i < n; i++) out.push(addDaysISO(startIso, i));
  return out;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return diffDays(checkIn, checkOut);
}

export function formatShort(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatWeekday(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}

export function formatDayNum(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "UTC" });
}
