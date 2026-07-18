import { NextResponse } from "next/server";

import {
  applySessionCache,
  applySessionCookies,
  clearSessionCookies,
  completePasswordSetup,
  getPasswordSetupInfo,
  isSameOriginRequest,
} from "@/lib/server-auth";

// Unauthenticated entry point — mirrors src/app/api/auth/register/route.ts.
// The customer has no session yet; this is how they get one for the first time.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const info = await getPasswordSetupInfo(token);
  if (!info) {
    return NextResponse.json({ message: "This link has expired or is invalid." }, { status: 404 });
  }
  return NextResponse.json(info);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }

  const { token } = await params;

  try {
    const { password } = (await request.json()) as { password?: string };
    if (!password) {
      return NextResponse.json({ message: "Password is required." }, { status: 400 });
    }

    const result = await completePasswordSetup(token, password);

    if (result.kind === "redirect-employee") {
      const response = NextResponse.json(
        { message: "Employee accounts must use the employee application." },
        { status: 403 },
      );
      return clearSessionCookies(response);
    }

    if (result.kind !== "authenticated") {
      const response = NextResponse.json(
        { message: "Unable to establish a customer session." },
        { status: 401 },
      );
      return clearSessionCookies(response);
    }

    let response = NextResponse.json({ session: result.session });
    response = applySessionCookies(response, result.tokens ?? {});
    return applySessionCache(response, result.session);
  } catch (error) {
    const isNetworkError =
      error instanceof Error && (error as Error & { isNetworkError?: boolean }).isNetworkError;

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to set password." },
      { status: isNetworkError ? 503 : 400 },
    );
  }
}
