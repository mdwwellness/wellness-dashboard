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
   
  const refreshRes = await fetch(`${base_url}/api/users/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `refreshToken=${refreshToken}`,
    },
    cache: "no-store",
  });

  if (!refreshRes.ok) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  const data = await refreshRes.json();
  const response = NextResponse.next();
  response.cookies.set("accessToken", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  return response;
}