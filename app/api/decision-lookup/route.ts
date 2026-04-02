import { NextRequest, NextResponse } from "next/server";

import type { DecisionLookupMode } from "@/lib/types";

function getCoreBaseUrl(): string {
  const coreBaseUrl = process.env.CORE_BASE_URL;

  if (!coreBaseUrl) {
    throw new Error("CORE_BASE_URL is not configured");
  }

  return coreBaseUrl;
}

export async function GET(request: NextRequest) {
  const mode = (request.nextUrl.searchParams.get("mode")?.trim() ??
    "signal_id") as DecisionLookupMode;
  const value = request.nextUrl.searchParams.get("value")?.trim() ?? "";

  if (!value) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_LOOKUP_QUERY",
          message: "lookup value is required.",
          trace_id: "unavailable",
          retryable: false
        }
      },
      { status: 400 }
    );
  }

  const lookupPath = (() => {
    switch (mode) {
      case "signal_id":
        return `/v1/signals/${encodeURIComponent(value)}/decision`;
      case "trace_id":
        return `/v1/decisions/by-trace/${encodeURIComponent(value)}`;
      case "correlation_id":
        return `/v1/decisions/by-correlation/${encodeURIComponent(value)}`;
      default:
        return null;
    }
  })();

  if (!lookupPath) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_LOOKUP_MODE",
          message: "lookup mode must be signal_id, trace_id, or correlation_id.",
          trace_id: "unavailable",
          retryable: false
        }
      },
      { status: 400 }
    );
  }

  try {
    const coreResponse = await fetch(`${getCoreBaseUrl()}${lookupPath}`, {
      method: "GET",
      cache: "no-store"
    });

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
