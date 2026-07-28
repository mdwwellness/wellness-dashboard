"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import type { MonthPoint } from "./analytics-metrics";

const BLUE = "#3b82f6";
const RED = "#ef4444";
const AXIS = "#94a3b8";

const monthShort = (m: string) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-IN", {
    month: "long",
  });
};

const monthCardLabel = (m: string) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1)
    .toLocaleString("en-IN", { month: "long", year: "numeric" })
    .toUpperCase();
};

interface MoMGrowthChartProps {
  title: string;
  subtitle: string;
  data: MonthPoint[]; // 12 points, oldest→newest
  /** Absolute monthly value → card big number (may carry a unit, e.g. "14 bookings"). */
  formatValue: (n: number) => string;
  /** Signed delta → badge text (e.g. "+₹11.9k", "-9 new"). */
  formatDelta: (n: number) => string;
  /** Compact, unit-less value → y-axis ticks. Defaults to formatValue. */
  formatAxis?: (n: number) => string;
}

export function MoMGrowthChart({
  title,
  subtitle,
  data,
  formatValue,
  formatDelta,
  formatAxis = formatValue,
}: MoMGrowthChartProps) {
  const [months, setMonths] = React.useState<6 | 12>(12);
  const gid = React.useId().replace(/:/g, "");
  const shown = data.slice(-months);

  const deltas = shown.map((d) => d.delta);
  const dataMax = Math.max(0, ...deltas);
  const dataMin = Math.min(0, ...deltas);
  // Offset where the gradient flips blue→red — the zero crossing.
  const off = dataMax <= 0 ? 0 : dataMin >= 0 ? 1 : dataMax / (dataMax - dataMin);

  const chartData = shown.map((d) => ({
    month: monthShort(d.month),
    delta: d.delta,
  }));

  return (
    <div className="rounded-xl border border-border p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <TrendingUp className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="inline-flex rounded-md border border-border p-0.5">
          {([6, 12] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMonths(n)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                months === n
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n} Months
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor={BLUE} />
              <stop offset={off} stopColor={RED} />
            </linearGradient>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.4} />
              <stop offset={off} stopColor={BLUE} stopOpacity={0.05} />
              <stop offset={off} stopColor={RED} stopOpacity={0.05} />
              <stop offset="100%" stopColor={RED} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 12, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => formatAxis(Number(v))}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--popover-foreground))",
              fontSize: 12,
            }}
            formatter={(v) => [formatDelta(Number(v)), "MoM change"]}
          />
          <Area
            type="monotone"
            dataKey="delta"
            stroke={`url(#stroke-${gid})`}
            strokeWidth={2.5}
            fill={`url(#fill-${gid})`}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {shown.map((p) => {
          const up = p.delta > 0;
          const flat = p.delta === 0;
          return (
            <div
              key={p.month}
              className="rounded-lg border border-border/70 p-3 text-center space-y-1.5"
            >
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground">
                {monthCardLabel(p.month)}
              </p>
              <p className="text-lg font-bold tabular-nums">{formatValue(p.value)}</p>
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                  flat
                    ? "bg-muted text-muted-foreground"
                    : up
                      ? "bg-violet-600/20 text-violet-300"
                      : "bg-red-600/25 text-red-300",
                )}
              >
                {flat ? "N/A" : formatDelta(p.delta)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
