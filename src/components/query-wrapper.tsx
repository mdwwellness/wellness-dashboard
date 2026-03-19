"use client";

import { Button } from "./ui/button";

interface QueryWrapperProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  skeleton?: React.ReactNode; 
  children: React.ReactNode;
}

export function QueryWrapper({
  isLoading,
  isError,
  error,
  onRetry,
  skeleton,
  children,
}: QueryWrapperProps) {
  if (isLoading) {
    return skeleton ? <>{skeleton}</> : <DefaultSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-md border border-destructive/30 bg-destructive/5">
        <p className="text-sm text-destructive">
          {error?.message ?? "Something went wrong"}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

function DefaultSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
    </div>
  );
}