import { NextResponse } from "next/server";

import { clearSessionCache, clearSessionCookies, isSameOriginRequest, logoutCustomer } from "@/lib/server-auth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Cross-origin request rejected." }, { status: 403 });
  }

  await logoutCustomer();

  let response = NextResponse.json({ ok: true });
  response = clearSessionCookies(response);
  return clearSessionCache(response);
}
