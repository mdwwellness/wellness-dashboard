"use server";
import { cookies } from "next/headers";
import { base_url } from "@/constant";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

// Build the Cookie header from ONLY the tokens that actually exist. Previously
// this always emitted `accessToken=${accessToken}`, so a missing/expired cookie
// sent the literal string "accessToken=undefined" — which the backend's
// jwt.verify() rejects as "Invalid token" (instead of a clean "no token").
function buildCookieHeader(
  accessToken?: string,
  refreshToken?: string,
): string | undefined {
  const parts: string[] = [];
  if (accessToken) parts.push(`accessToken=${accessToken}`);
  if (refreshToken) parts.push(`refreshToken=${refreshToken}`);
  return parts.length ? parts.join("; ") : undefined;
}

// Exchange the (long-lived) refresh token for a fresh access token via the
// backend's existing endpoint, and best-effort persist it as the accessToken
// cookie. Returns the new access token so the caller can retry immediately,
// even in contexts where cookie mutation isn't allowed.
async function refreshAccessToken(
  cookieStore: CookieStore,
  refreshToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${base_url}/api/users/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = await res.json().catch(() => ({}));
    const newAccessToken: string | undefined = body?.accessToken;
    if (!newAccessToken) return null;

    // Persist for subsequent requests. cookies().set() throws outside a Server
    // Action / Route Handler — swallow that: the token is still usable for the
    // immediate retry below even if we can't persist it here.
    try {
      cookieStore.set("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });
    } catch {
      /* not in a mutable-cookie context — ignore, retry still works */
    }

    return newAccessToken;
  } catch {
    return null;
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  const run = (at?: string) => {
    const cookie = buildCookieHeader(at, refreshToken);
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...options.headers,
      },
    });
  };

  let res = await run(accessToken);

  // Access token missing/expired/invalid → try a one-time refresh with the
  // (7-day) refresh token, then replay the original request. This closes the
  // gap where a server action fires after the 15-min access token has lapsed
  // (page-navigation middleware can't cover that same-request case).
  if (res.status === 401 && refreshToken) {
    const newAccessToken = await refreshAccessToken(cookieStore, refreshToken);
    if (newAccessToken) {
      res = await run(newAccessToken);
    }
  }

  return res;
}
