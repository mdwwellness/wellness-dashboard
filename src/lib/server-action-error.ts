"use server";

import { AuthRefreshFailedError, AUTH_REFRESH_FAILED_CODE } from "./auth-errors";
import type { ApiResponse } from "@/type/api";

export { AUTH_REFRESH_FAILED_CODE };

/**
 * Helper to wrap server action calls and convert AuthRefreshFailedError
 * into a proper ApiResponse with the error code.
 *
 * @example
 * ```ts
 * export default async function getAllAppointments(user: UserType): Promise<ApiResponse<any>> {
 *   return withAuthErrorHandling(async () => {
 *     const response = await fetchWithAuth(...);
 *     // ... handle response
 *   });
 * }
 * ```
 */
export async function withAuthErrorHandling<T extends ApiResponse>(
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthRefreshFailedError) {
      return {
        success: false,
        message: error.message,
        code: AUTH_REFRESH_FAILED_CODE,
      } as T;
    }
    throw error;
  }
}
