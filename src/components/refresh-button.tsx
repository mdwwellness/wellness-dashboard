"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Icon refresh button used across list/dashboard pages. Each caller provides
 * its own refetch action; this owns the shared chrome + spin state so the
 * pattern isn't copy-pasted per page. Pass `withText` for the labelled
 * (icon + "Refresh" text) variant.
 */
export function RefreshButton({
  onClick,
  isFetching,
  label = "Refresh",
  withText = false,
}: {
  onClick: () => void;
  isFetching?: boolean;
  label?: string;
  withText?: boolean;
}) {
  const spin = isFetching ? "animate-spin" : "";

  if (withText) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isFetching}
        className="shrink-0"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${spin}`} />
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={isFetching}
      aria-label={label}
      title={label}
    >
      <RefreshCw className={`h-4 w-4 ${spin}`} />
    </Button>
  );
}
