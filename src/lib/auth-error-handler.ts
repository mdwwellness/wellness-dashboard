"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AUTH_REFRESH_FAILED_CODE } from "./auth-errors";

export { AUTH_REFRESH_FAILED_CODE };

/**
 * Check if an error is an auth refresh failure and show a toast + redirect to login.
 * Use this in TanStack Query onError handlers.
 *
 * @example
 * ```ts
 * onError: (err: Error) => {
 *   if (handleAuthError(err, router)) return;
 *   toast.error(err.message);
 * }
 * ```
 */
export function handleAuthError(
  error: Error | { code?: string; message?: string },
  router: ReturnType<typeof useRouter>,
): boolean {
  // Check if the error has our auth failure code
  const code = (error as { code?: string }).code;
  if (code === AUTH_REFRESH_FAILED_CODE) {
    toast.error("Session expired", {
      description: "Your login session has expired. Please log in again.",
      duration: 5000,
      action: {
        label: "Go to Login",
        onClick: () => router.push("/auth/login"),
      },
    });
    return true;
  }

  // Also check error message for the auth failure string
  if (
    error.message?.includes("Session expired") ||
    error.message?.includes("log in again")
  ) {
    toast.error("Session expired", {
      description: "Your login session has expired. Please log in again.",
      duration: 5000,
      action: {
        label: "Go to Login",
        onClick: () => router.push("/auth/login"),
      },
    });
    return true;
  }

  return false;
}
