"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RefreshButton } from "@/components/refresh-button";
import { MetricCard, MetricCardsRow } from "@/components/metric-card";
import { QueryWrapper } from "@/components/query-wrapper";
import { formatINR } from "@/components/pages/services/services-columns";
import { useAuthStore } from "@/providers/permission-provider";
import { useGetAllEnquiries } from "@/data/enquiry/enquiry";
import type { EnquiryType } from "@/type/schema";

import { deriveAnalytics } from "./analytics-metrics";

/** One labelled horizontal bar. Shared by every "chart" here — no chart lib. */
function Bar({
  label,
  value,
  max,
  display,
  tone = "primary",
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  tone?: "primary" | "emerald" | "amber";
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  const fill =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{display}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** A titled panel wrapper matching the app's card styling. */
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
  return <p className="text-sm text-muted-foreground">{children}</p>;
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
        <div key={i} className="border border-border p-5 rounded-xl h-40 space-y-3">
          <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-24 w-full rounded bg-muted animate-pulse" />
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

  const maxTrend = Math.max(1, ...a.revenueTrend.map((t) => t.revenue));
  const maxMix = Math.max(1, ...a.serviceMix.map((m) => m.revenue));
  const maxLoad = Math.max(1, ...a.therapistLoad.map((t) => t.bookings));

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
                <Panel title="Pipeline" hint="Enquiry → Booking → Paid">
                  <Bar
                    label="Enquiries"
                    value={a.pipeline.enquiries}
                    max={a.pipeline.enquiries}
                    display={String(a.pipeline.enquiries)}
                  />
                  <Bar
                    label="Bookings"
                    value={a.pipeline.bookings}
                    max={a.pipeline.enquiries}
                    display={String(a.pipeline.bookings)}
                  />
                  <Bar
                    label="Paid"
                    value={a.pipeline.paid}
                    max={a.pipeline.enquiries}
                    display={String(a.pipeline.paid)}
                    tone="emerald"
                  />
                </Panel>

                <Panel title="Revenue by service">
                  {a.serviceMix.length === 0 ? (
                    <Empty>No collected revenue yet.</Empty>
                  ) : (
                    a.serviceMix.map((m) => (
                      <Bar
                        key={m.label}
                        label={m.label}
                        value={m.revenue}
                        max={maxMix}
                        display={formatINR(m.revenue)}
                      />
                    ))
                  )}
                </Panel>

                <Panel
                  title="Revenue trend"
                  hint="Collected per month (last 6)"
                >
                  {a.revenueTrend.every((t) => t.revenue === 0) ? (
                    <Empty>Not enough history yet.</Empty>
                  ) : (
                    a.revenueTrend.map((t) => (
                      <Bar
                        key={t.month}
                        label={
                          MONTH_LABEL(t.month) +
                          (t.momPct != null
                            ? `  (${t.momPct >= 0 ? "+" : ""}${Math.round(t.momPct)}%)`
                            : "")
                        }
                        value={t.revenue}
                        max={maxTrend}
                        display={formatINR(t.revenue)}
                      />
                    ))
                  )}
                </Panel>

                <Panel
                  title="Collected vs pending"
                  hint="Money in the door vs still owed"
                >
                  <Bar
                    label="Collected"
                    value={a.collected}
                    max={a.collected + a.pending}
                    display={formatINR(a.collected)}
                    tone="emerald"
                  />
                  <Bar
                    label="Pending"
                    value={a.pending}
                    max={a.collected + a.pending}
                    display={formatINR(a.pending)}
                    tone="amber"
                  />
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
                <MetricCard
                  label="Needs first contact"
                  value={a.needsFirstContact}
                />
                <MetricCard
                  label="Therapists booked this week"
                  value={a.therapistLoad.length}
                />
              </div>

              <Panel title="Therapist load" hint="Bookings this week">
                {a.therapistLoad.length === 0 ? (
                  <Empty>No therapist bookings scheduled this week.</Empty>
                ) : (
                  a.therapistLoad.map((t) => (
                    <Bar
                      key={t.name}
                      label={t.name}
                      value={t.bookings}
                      max={maxLoad}
                      display={String(t.bookings)}
                    />
                  ))
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
