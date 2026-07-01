import { NextResponse } from "next/server";

import {
  applySessionCache,
  applySessionCookies,
  clearSessionCache,
  clearSessionCookies,
  getEmployeeAppUrl,
  resolveSessionFromCookies,
} from "@/lib/server-auth";

export async function GET() {
  const result = await resolveSessionFromCookies();

  if (result.kind === "authenticated") {
    let response = NextResponse.json({
      status: "authenticated" as const,
      session: result.session,
    });
    response = applySessionCookies(response, result.tokens ?? {});
    // Only re-seed the session cache cookie on real backend round-trips
    // (when result.tokens is defined). On cache hits, do not reset TTL.
    if (result.tokens) {
      response = applySessionCache(response, result.session);
    }
    return response;
  }

  if (result.kind === "redirect-employee") {
    let response = NextResponse.json(
      {
        status: "unauthenticated" as const,
        session: null,
        employeeAppUrl: getEmployeeAppUrl(),
        message: "Employee accounts must use the employee application.",
      },
      { status: 403 },
    );
    response = clearSessionCookies(response);
    return clearSessionCache(response);
  }

  let response = NextResponse.json({
    status: result.reason === "expired" ? "session_expired" : "unauthenticated",
    session: null,
  });
  response = clearSessionCookies(response);
  return clearSessionCache(response);
}
