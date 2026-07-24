import { NextRequest, NextResponse } from "next/server";

import {
  applySessionCookies,
  clearSessionCookies,
  getApiBaseUrl,
  getValidAccessToken,
  isSameOriginRequest,
} from "@/lib/server-auth";

// Long-running SSE stream (the backend can take tens of seconds on a cold
// OpenRouter call) — the platform default function duration would cut this
// off mid-response otherwise.
export const maxDuration = 60;

/**
 * Streaming proxy for POST /api/ai/user-chat/ (see api/views/ai.py::user_chat
 * on smart-solar-django-backend). Deliberately does NOT go through
 * buildBackendRequest/backendFetch — that helper's 10s AbortController
 * timeout is fine for ordinary JSON calls but would kill this stream long
 * before the backend's own 15s `[KEEPALIVE]` frames ever arrive.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const body = await request.text();

  const { accessToken, refreshedAccessToken } = await getValidAccessToken();
  if (!accessToken) {
    const res = NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    res.headers.set("X-Auth-Status", "session-expired");
    return clearSessionCookies(res);
  }

  let backendResponse: Response;
  try {
    // No AbortController timeout here on purpose — the backend's own
    // keepalive framing is what keeps this connection healthy, not a
    // client-side cutoff. `maxDuration` above is the real ceiling.
    backendResponse = await fetch(`${getApiBaseUrl()}/api/ai/user-chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Unable to reach the assistant. Please try again." }, { status: 503 });
  }

  // Non-streaming error responses (403/429/503/400 from the Django view) —
  // pass the JSON body through untouched rather than trying to treat it as SSE.
  const contentType = backendResponse.headers.get("content-type") ?? "";
  if (!backendResponse.ok || !contentType.includes("text/event-stream")) {
    const proxyResponse = new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: { "Content-Type": contentType || "application/json", "Cache-Control": "private, no-store" },
    });
    return refreshedAccessToken ? applySessionCookies(proxyResponse, { access: refreshedAccessToken }) : proxyResponse;
  }

  const proxyResponse = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

  return refreshedAccessToken ? applySessionCookies(proxyResponse, { access: refreshedAccessToken }) : proxyResponse;
}
