import { NextResponse } from "next/server";

import { clearSessionCache, clearSessionCookies, logoutCustomer } from "@/lib/server-auth";

export async function POST() {
  await logoutCustomer();

  let response = NextResponse.json({ ok: true });
  response = clearSessionCookies(response);
  return clearSessionCache(response);
}
