import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { base_url } from "./constant";

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp * 1000 < Date.now() + 10 * 1000;
  } catch {
    return true; 
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const accessToken = request.cookies.get("accessToken")?.value;
  const isAuthPage = pathname.startsWith("/auth");

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/uploadthing') ||
    // Customer-facing payment page — the whole point is that the customer,
    // who has no dashboard login, can open it. Guarded by an unguessable
    // token instead (see /pay/[token]).
    pathname.startsWith('/pay') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  if (!refreshToken && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (refreshToken && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!refreshToken || isAuthPage) {
    return NextResponse.next();
  }

  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  if (!base_url) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  // fetch() THROWS when the backend is unreachable (local dev with the server
  // down, a Render cold start, a network blip) — it does not return a non-ok
  // response. Unguarded, that surfaces as a raw "TypeError: fetch failed"
  // crash page instead of any useful behaviour.
  let refreshRes: Response;
  try {
    refreshRes = await fetch(`${base_url}/api/users/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });
  } catch {
    // We never reached the backend, so we don't know whether this session is
    // valid — and signing the user out over a transient blip would be wrong.
    // Let the request through with cookies intact: the data layer surfaces the
    // failure, and the next navigation refreshes cleanly once it's back.
    //
    // NOTE: redirecting to /auth/login here would infinite-loop — the
    // refreshToken is still set, so the isAuthPage branch above bounces it
    // straight back to /dashboard.
    return NextResponse.next();
  }

  if (!refreshRes.ok) {
    // A real answer from the server: this refresh token is rejected. Sign out.
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  // 200 but an unusable body/token — treat as a failed refresh rather than
  // writing an "undefined" cookie that fails every request after this one.
  const data = await refreshRes.json().catch(() => null);
  const nextAccessToken =
    typeof data?.accessToken === "string" ? data.accessToken : "";
  if (!nextAccessToken) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set("accessToken", nextAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  return response;
}