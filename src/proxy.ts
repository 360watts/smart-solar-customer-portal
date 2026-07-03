import { NextRequest, NextResponse } from "next/server";

import {
  applySessionCookies,
  clearSessionCookies,
  getEmployeeAppUrl,
  resolveSessionFromTokens,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/server-auth";

const LOGIN_PATH = "/auth/login";
const PORTAL_HOME = "/dashboard";

function isProtectedPath(pathname: string): boolean {
  return [
    "/dashboard",
    "/solar",
    "/consumption",
    "/history",
    "/savings",
    "/weather",
    "/alerts",
    "/device",
    "/care",
    "/profile",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const hasCookies = Boolean(access || refresh);

  if (!hasCookies) {
    if (isProtectedPath(pathname)) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
    return NextResponse.next();
  }

  const result = await resolveSessionFromTokens({ access, refresh });

  if (result.kind === "authenticated") {
    if (pathname === LOGIN_PATH) {
      const response = NextResponse.redirect(new URL(PORTAL_HOME, request.url));
      return applySessionCookies(response, result.tokens ?? {});
    }

    const response = NextResponse.next();
    return applySessionCookies(response, result.tokens ?? {});
  }

  if (result.kind === "redirect-employee") {
    const employeeAppUrl = getEmployeeAppUrl();
    const response = employeeAppUrl
      ? NextResponse.redirect(employeeAppUrl)
      : NextResponse.redirect(new URL("/unauthorized", request.url));
    return clearSessionCookies(response);
  }

  if (pathname === LOGIN_PATH) {
    return clearSessionCookies(NextResponse.next());
  }

  return clearSessionCookies(
    NextResponse.redirect(new URL(LOGIN_PATH, request.url)),
  );
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/solar/:path*",
    "/consumption/:path*",
    "/history/:path*",
    "/savings/:path*",
    "/weather/:path*",
    "/alerts/:path*",
    "/device/:path*",
    "/care/:path*",
    "/profile/:path*",
  ],
};
