import { NextRequest, NextResponse } from "next/server";

import { applySessionCookies, buildBackendRequest, clearSessionCookies } from "@/lib/server-auth";

async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const { response, refreshedAccessToken } = await buildBackendRequest({
    path: params.path.join("/"),
    method: request.method,
    search: request.nextUrl.search,
    body,
    contentType: request.headers.get("content-type"),
  });

  const responseBody = await response.text();
  const proxyResponse = new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });

  if (response.status === 401) {
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
