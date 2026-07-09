import { NextResponse } from "next/server";

import {
  applySessionCache,
  applySessionCookies,
  clearSessionCookies,
  isSameOriginRequest,
  registerCustomerFromInvite,
} from "@/lib/server-auth";

// Invite-only — see api/views/auth.py register_user: registration without a
// valid pending invite_token is rejected server-side. This route has no
// separate public-signup counterpart by design.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }

  try {
    const { invite_token, email, password, first_name, last_name } = (await request.json()) as {
      invite_token?: string;
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
    };

    if (!invite_token || !email || !password) {
      return NextResponse.json(
        { message: "Invite token, email, and password are required." },
        { status: 400 },
      );
    }

    const result = await registerCustomerFromInvite({ invite_token, email, password, first_name, last_name });

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
      { message: error instanceof Error ? error.message : "Registration failed." },
      { status: isNetworkError ? 503 : 400 },
    );
  }
}
