import { NextResponse } from "next/server";

import {
  applySessionCookies,
  clearSessionCookies,
  getEmployeeAppUrl,
  resolveSessionFromCookies,
} from "@/lib/server-auth";

export async function GET() {
  const result = await resolveSessionFromCookies();

  if (result.kind === "authenticated") {
    const response = NextResponse.json({
      status: "authenticated" as const,
      session: result.session,
    });

    return applySessionCookies(response, result.tokens ?? {});
  }

  if (result.kind === "redirect-employee") {
    const response = NextResponse.json(
      {
        status: "unauthenticated" as const,
        session: null,
        employeeAppUrl: getEmployeeAppUrl(),
        message: "Employee accounts must use the employee application.",
      },
      { status: 403 },
    );

    return clearSessionCookies(response);
  }

  const response = NextResponse.json({
    status: result.reason === "expired" ? "session_expired" : "unauthenticated",
    session: null,
  });

  return clearSessionCookies(response);
}
