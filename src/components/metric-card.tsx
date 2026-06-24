import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Compact metric/KPI card used for the per-page "today" rows and the main
 * dashboard "totals" grid.
 */
export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-2 px-6">
        <p className="text-sm font-medium text-muted-foreground leading-none">
          {label}
        </p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums leading-none">
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Responsive grid wrapper: 2 cols on phones → up to 4 on desktop. */
export function MetricCardsRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
