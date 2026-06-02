export type TimeRange = { from: string; to: string };

export function formatTime12(hhmm: string | undefined): string {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(range: TimeRange | undefined): string {
  if (!range?.from || !range?.to) return "—";
  return `${formatTime12(range.from)} – ${formatTime12(range.to)}`;
}
