import { NextResponse } from "next/server";

import {
  applySessionCache,
  applySessionCookies,
  clearSessionCookies,
  getEmployeeAppUrl,
  isSameOriginRequest,
  loginCustomer,
} from "@/lib/server-auth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }

  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const result = await loginCustomer(email, password);

    if (result.kind === "redirect-employee") {
      const response = NextResponse.json(
        {
          message: "Employee accounts must use the employee application.",
          employeeAppUrl: getEmployeeAppUrl(),
        },
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
    // Distinguish network/infrastructure failures from credential errors.
    const isNetworkError =
      error instanceof Error && (error as Error & { isNetworkError?: boolean }).isNetworkError;

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Login failed." },
      { status: isNetworkError ? 503 : 401 },
    );
  }
}
