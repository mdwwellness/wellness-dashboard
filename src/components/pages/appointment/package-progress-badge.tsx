"use client";

import { Badge } from "@/components/ui/badge";
import type { PackageProgress } from "@/lib/package-progress";

export function PackageProgressBadge({ progress }: { progress: PackageProgress }) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] border-emerald-600 text-emerald-700 bg-emerald-50 whitespace-nowrap"
      title={progress.packageName}
    >
      {progress.label}
    </Badge>
  );
}

export function PackageProgressCard({ progress }: { progress: PackageProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-emerald-800">Package progress</p>
          <p className="text-sm font-semibold">{progress.packageName}</p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-600 text-emerald-700 bg-white shrink-0"
        >
          {progress.label}
        </Badge>
      </div>
      <div className="h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-emerald-900">
        {progress.completed} session{progress.completed === 1 ? "" : "s"} done ·{" "}
        {Math.max(progress.total - progress.completed, 0)} remaining
      </p>
      {progress.currentLabel && (
        <p className="text-xs text-muted-foreground">{progress.currentLabel}</p>
      )}
    </div>
  );
}
