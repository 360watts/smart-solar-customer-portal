import { NextRequest, NextResponse } from "next/server";

import {
  applySessionCookies,
  buildBackendRequest,
  clearSessionCookies,
} from "@/lib/server-auth";

async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  let params: { path: string[] };
  try {
    params = await context.params;
  } catch {
    return NextResponse.json({ error: "Invalid request path." }, { status: 400 });
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  let proxyResult: Awaited<ReturnType<typeof buildBackendRequest>>;
  try {
    proxyResult = await buildBackendRequest({
      path: params.path.join("/"),
      method: request.method,
      search: request.nextUrl.search,
      body,
      contentType: request.headers.get("content-type"),
    });
  } catch (err) {
    // Network-level failure (timeout, Railway down, DNS) — return a clean JSON 503
    // instead of letting Next.js emit a 500 HTML error page.
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const message = isTimeout
      ? "Backend request timed out."
      : "Unable to reach backend service.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const { response, refreshedAccessToken, forwardHeaders, tokenExpired } = proxyResult;

  const proxyResponse = new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "private, no-store",
      ...forwardHeaders,
    },
  });

  // Only clear session cookies when the JWT itself has expired/invalid.
  // Resource-level 401s (staff-only endpoints accessed by customers) must NOT
  // trigger a logout — buildBackendRequest converts those to 403 instead.
  if (response.status === 401 && tokenExpired) {
    proxyResponse.headers.set("X-Auth-Status", "session-expired");
    return clearSessionCookies(proxyResponse);
  }

  return refreshedAccessToken
    ? applySessionCookies(proxyResponse, { access: refreshedAccessToken })
    : proxyResponse;
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}
