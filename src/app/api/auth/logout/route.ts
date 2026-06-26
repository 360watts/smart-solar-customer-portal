import { NextResponse } from "next/server";

import { clearSessionCookies, logoutCustomer } from "@/lib/server-auth";

export async function POST() {
  await logoutCustomer();

  return clearSessionCookies(
    NextResponse.json({
      ok: true,
    }),
  );
}
