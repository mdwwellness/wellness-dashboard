"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RefreshButton } from "@/components/refresh-button";
import { MetricCard, MetricCardsRow } from "@/components/metric-card";
import { QueryWrapper } from "@/components/query-wrapper";
import { formatINR } from "@/components/pages/services/services-columns";
import { useAuthStore } from "@/providers/permission-provider";
import { useGetAllEnquiries } from "@/data/enquiry/enquiry";
import type { EnquiryType } from "@/type/schema";

import { deriveAnalytics } from "./analytics-metrics";

// Brand-led palette (brand primary is #018bc4). Semantic emerald/amber for
// money in vs money owed; the rest cycle for categorical slices.
const PRIMARY = "#018bc4";
const EMERALD = "#10b981";
const AMBER = "#f59e0b";
const SLICE_COLORS = [PRIMARY, EMERALD, AMBER, "#8b5cf6", "#ec4899", "#64748b"];
const AXIS = "#94a3b8"; // readable on both light and dark

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
};

const inrTip = (v: unknown) => formatINR(Number(v ?? 0));

/** A titled panel matching the app's card styling. */
function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

const MONTH_LABEL = (m: string) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-IN", {
    month: "short",
  });
};

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border p-5 rounded-xl h-64 space-y-3">
          <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-44 w-full rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

const AnalyticsPage = () => {
  const { user } = useAuthStore();
  const { id, role, userEmail } = user || {};
  const queryClient = useQueryClient();

  const enq = useGetAllEnquiries({ role, id, userEmail });
  const records = React.useMemo(
    () => (enq.data ?? []) as EnquiryType[],
    [enq.data],
  );
  const a = React.useMemo(() => deriveAnalytics(records), [records]);

  // Analytics is a back-office view; therapists get their own dashboard.
  // ponytail: nav/role visibility only — real enforcement is server-side when
  // the access model needs it (see spec §4).
  if (role === "THERAPIST") {
    return (
      <div className="w-full px-4 md:px-8 pt-10">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-4 text-muted-foreground">
          Analytics is available to owners and back-office staff.
        </p>
      </div>
    );
  }

  const pipelineData = [
    { name: "Enquiries", value: a.pipeline.enquiries, fill: "#94a3b8" },
    { name: "Bookings", value: a.pipeline.bookings, fill: PRIMARY },
    { name: "Paid", value: a.pipeline.paid, fill: EMERALD },
  ];
  const mixData = a.serviceMix.map((m) => ({ name: m.label, value: m.revenue }));
  const splitData = [
    { name: "Collected", value: a.collected },
    { name: "Pending", value: a.pending },
  ];
  const trendData = a.revenueTrend.map((t) => ({
    month: MONTH_LABEL(t.month),
    revenue: t.revenue,
    momPct: t.momPct,
  }));
  const loadData = a.therapistLoad.map((t) => ({
    name: t.name,
    value: t.bookings,
  }));

  return (
    <div className="w-full flex flex-col gap-6 px-3 sm:px-4 md:px-8 pt-10 pb-16">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-3xl md:text-4xl font-bold">Analytics</h1>
        <RefreshButton
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["enquiries"] })
          }
          isFetching={enq.isFetching}
          label="Refresh analytics"
        />
      </div>

      <QueryWrapper
        isLoading={enq.isLoading}
        isError={enq.isError}
        error={enq.error}
        onRetry={enq.refetch}
        skeleton={<AnalyticsSkeleton />}
      >
        {!a.hasData ? (
          <Empty>Not enough data yet — analytics fill in as bookings arrive.</Empty>
        ) : (
          <>
            {/* Zone A — business health */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Business health
              </h2>
              <MetricCardsRow className="w-full">
                <MetricCard
                  label="Revenue this month"
                  value={formatINR(a.revenueThisMonth)}
                />
                <MetricCard
                  label="Collected"
                  value={`${formatINR(a.collected)} · ${Math.round(a.collectedPct)}%`}
                />
                <MetricCard label="Bookings this month" value={a.bookingsThisMonth} />
                <MetricCard
                  label="Conversion"
                  value={`${Math.round(a.conversionPct)}%`}
                />
              </MetricCardsRow>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Revenue trend" hint="Collected per month (last 6)">
                  {trendData.every((t) => t.revenue === 0) ? (
                    <Empty>Not enough history yet.</Empty>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={trendData} margin={{ left: 4, right: 8, top: 8 }}>
                        <defs>
                          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fill: AXIS }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: AXIS }}
                          tickLine={false}
                          axisLine={false}
                          width={48}
                          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v) => [inrTip(v), "Revenue"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke={PRIMARY}
                          strokeWidth={2}
                          fill="url(#revFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Panel>

                <Panel title="Revenue by service">
                  {mixData.length === 0 ? (
                    <Empty>No collected revenue yet.</Empty>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={mixData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {mixData.map((_, i) => (
                            <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v, n) => [inrTip(v), n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {mixData.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {mixData.map((m, i) => (
                        <span key={m.name} className="flex items-center gap-1.5 text-xs">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                          />
                          {m.name} · {formatINR(m.value)}
                        </span>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="Pipeline" hint="Enquiry → Booking → Paid">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={pipelineData}
                      layout="vertical"
                      margin={{ left: 8, right: 24 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: AXIS }}
                        tickLine={false}
                        axisLine={false}
                        width={72}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26}>
                        {pipelineData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                        <LabelList dataKey="value" position="right" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>

                <Panel title="Collected vs pending" hint="Money in vs still owed">
                  {a.collected + a.pending === 0 ? (
                    <Empty>No booked revenue yet.</Empty>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={splitData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                          >
                            <Cell fill={EMERALD} />
                            <Cell fill={AMBER} />
                          </Pie>
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v, n) => [inrTip(v), n]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: EMERALD }} />
                          Collected · {formatINR(a.collected)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: AMBER }} />
                          Pending · {formatINR(a.pending)}
                        </span>
                      </div>
                    </>
                  )}
                </Panel>
              </div>
            </section>

            {/* Zone B — operational */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Operational
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MetricCard
                  label="Pending payments"
                  value={`${formatINR(a.pending)} · ${a.pendingCount} booking${a.pendingCount === 1 ? "" : "s"}`}
                />
                <MetricCard label="Needs first contact" value={a.needsFirstContact} />
                <MetricCard
                  label="Therapists booked this week"
                  value={a.therapistLoad.length}
                />
              </div>

              <Panel title="Therapist load" hint="Bookings this week">
                {loadData.length === 0 ? (
                  <Empty>No therapist bookings scheduled this week.</Empty>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(160, loadData.length * 44)}>
                    <BarChart
                      data={loadData}
                      layout="vertical"
                      margin={{ left: 8, right: 24 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: AXIS }}
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
                      <Bar dataKey="value" fill={PRIMARY} radius={[0, 6, 6, 0]} barSize={22}>
                        <LabelList dataKey="value" position="right" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </section>
          </>
        )}
      </QueryWrapper>
    </div>
  );
};

export default AnalyticsPage;
