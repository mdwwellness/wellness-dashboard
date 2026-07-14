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
            // Only toast here when the mutation has no onError of its own —
            // otherwise both fire and the user sees a duplicate toast.
            if (mutation.options.onError) return;
            toast.error(error.message);
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
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