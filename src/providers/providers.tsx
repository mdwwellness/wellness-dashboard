"use client";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: Error) => {
            toast.error(error.message);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: Error, _variables, _context, mutation) => {
            // Only toast here when the mutation has no onError of its own -
            // otherwise both fire and the user sees a duplicate toast.
            if (mutation.options.onError) return;
            toast.error(error.message);
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            // Cache until an explicit refresh. Data is fetched once and reused
            // across the session; it only re-hits the DB when a refresh button
            // (invalidateQueries) or a mutation invalidates the cache. No
            // time-based, mount, focus, or reconnect refetching.
            staleTime: Infinity,
            gcTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}