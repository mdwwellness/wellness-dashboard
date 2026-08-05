/**
 * Custom error class for authentication failures that can't be recovered.
 * Server actions should catch this and return a specific error code so the
 * client can show a proper toast and redirect to login.
 */
export class AuthRefreshFailedError extends Error {
  constructor(message = "Session expired. Please log in again.") {
    super(message);
    this.name = "AuthRefreshFailedError";
  }
}

export const AUTH_REFRESH_FAILED_CODE = "AUTH_REFRESH_FAILED";
