import { NextRequest, NextResponse } from "next/server";

function getCoreBaseUrl(): string {
  const coreBaseUrl = process.env.CORE_BASE_URL;

  if (!coreBaseUrl) {
    throw new Error("CORE_BASE_URL is not configured");
  }

  return coreBaseUrl;
}

export async function GET(request: NextRequest) {
  const signalId = request.nextUrl.searchParams.get("signal_id")?.trim() ?? "";

  if (!signalId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_SIGNAL_ID_QUERY",
          message: "signal_id query parameter is required.",
          trace_id: "unavailable",
          retryable: false
        }
      },
      { status: 400 }
    );
  }

  try {
    const coreResponse = await fetch(
      `${getCoreBaseUrl()}/v1/signals/${encodeURIComponent(signalId)}/decision`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    const responseBody = await coreResponse.json();
    return NextResponse.json(responseBody, { status: coreResponse.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPSTREAM_REQUEST_FAILED",
          message: "Console could not reach the core decision retrieval endpoint.",
          trace_id: "unavailable",
          retryable: true,
          details: {
            issue: "network_or_system_failure",
            received: error instanceof Error ? error.message : "unknown error"
          }
        }
      },
      { status: 502 }
    );
  }
}
