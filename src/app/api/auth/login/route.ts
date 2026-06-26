import { NextResponse } from "next/server";

import {
  applySessionCookies,
  clearSessionCookies,
  getEmployeeAppUrl,
  loginCustomer,
} from "@/lib/server-auth";

export async function POST(request: Request) {
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

    const response = NextResponse.json({
      session: result.session,
    });

    return applySessionCookies(response, result.tokens ?? {});
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Login failed.",
      },
      { status: 401 },
    );
  }
}
