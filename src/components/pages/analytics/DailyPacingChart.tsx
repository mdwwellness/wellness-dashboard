"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { EnquiryType } from "@/type/schema";
import { deriveDailyPacing, monthOptions } from "./analytics-metrics";

const CURRENT = "#10b981"; // this month — emerald
const PREVIOUS = "#3b82f6"; // previous month — blue
const AXIS = "#94a3b8";

const shortLabel = (key: string) => {
  const [y, mo] = key.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

const prevLabel = (key: string) => {
  const [y, mo] = key.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return d.toLocaleString("en-IN", { month: "short", year: "numeric" });
};

interface DailyPacingChartProps {
  records: EnquiryType[];
  now?: Date;
  formatValue: (n: number) => string;
}

export function DailyPacingChart({
  records,
  now = new Date(),
  formatValue,
}: DailyPacingChartProps) {
  const options = React.useMemo(() => monthOptions(now, 12), [now]);
  const [month, setMonth] = React.useState(options[0].key);
  const data = React.useMemo(
    () => deriveDailyPacing(records, month),
    [records, month],
  );

  const curLabel = shortLabel(month);
  const preLabel = prevLabel(month);

  return (
    <div className="rounded-xl border border-border p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
          <div>
            <h3 className="text-base font-semibold">Daily Revenue Pacing</h3>
            <p className="text-xs text-muted-foreground">
              Daily collected revenue for the chosen month vs the one before.
            </p>
          </div>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-center gap-5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CURRENT }} />
          {curLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PREVIOUS }} />
          {preLabel}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="pace-cur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CURRENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CURRENT} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pace-prev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PREVIOUS} stopOpacity={0.3} />
              <stop offset="100%" stopColor={PREVIOUS} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 12, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => formatValue(Number(v))}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--popover-foreground))",
              fontSize: 12,
            }}
            labelFormatter={(d) => `Day ${d}`}
            formatter={(v, n) => [
              formatValue(Number(v)),
              n === "current" ? curLabel : preLabel,
            ]}
          />
          <Area
            type="monotone"
            dataKey="previous"
            stroke={PREVIOUS}
            strokeWidth={2}
            fill="url(#pace-prev)"
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke={CURRENT}
            strokeWidth={2}
            fill="url(#pace-cur)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
