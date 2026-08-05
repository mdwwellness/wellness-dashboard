export type ApiResponse<T = null> = {
  success: boolean;
  message: string;
  data?: T;
  /** Error code for specific error types, e.g. "AUTH_REFRESH_FAILED" */
  code?: string;
};