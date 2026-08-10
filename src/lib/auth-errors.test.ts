import { describe, it, expect } from "vitest";
import { AuthRefreshFailedError, AUTH_REFRESH_FAILED_CODE } from "./auth-errors";

describe("AuthRefreshFailedError", () => {
  it("is an instance of Error", () => {
    const error = new AuthRefreshFailedError();
    expect(error).toBeInstanceOf(Error);
  });

  it("has name set to AuthRefreshFailedError", () => {
    const error = new AuthRefreshFailedError();
    expect(error.name).toBe("AuthRefreshFailedError");
  });

  it("has default message when none provided", () => {
    const error = new AuthRefreshFailedError();
    expect(error.message).toBe("Session expired. Please log in again.");
  });

  it("uses custom message when provided", () => {
    const error = new AuthRefreshFailedError("Custom error message");
    expect(error.message).toBe("Custom error message");
  });
});

describe("AUTH_REFRESH_FAILED_CODE", () => {
  it("is a string constant", () => {
    expect(typeof AUTH_REFRESH_FAILED_CODE).toBe("string");
    expect(AUTH_REFRESH_FAILED_CODE).toBe("AUTH_REFRESH_FAILED");
  });
});
