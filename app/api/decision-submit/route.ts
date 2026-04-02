import { NextResponse } from "next/server";

import type { DecisionSubmissionRequest } from "@/lib/types";

function getCoreBaseUrl(): string {
  const coreBaseUrl = process.env.CORE_BASE_URL;

  if (!coreBaseUrl) {
    throw new Error("CORE_BASE_URL is not configured");
  }

  return coreBaseUrl;
}

export async function POST(request: Request) {
  let payload: DecisionSubmissionRequest;

  try {
    payload = (await request.json()) as DecisionSubmissionRequest;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_JSON_BODY",
          message: "Request body must be valid JSON.",
          trace_id: "unavailable",
          retryable: false
        }
      },
      { status: 400 }
    );
  }

  try {
    const coreResponse = await fetch(
      `${getCoreBaseUrl()}/v1/signals/${payload.signal_id}/decision`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-trace-id": payload.trace_id,
          "x-correlation-id": payload.correlation_id
        },
        body: JSON.stringify(payload),
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
          message: "Console could not reach the core decision endpoint.",
          trace_id: payload.trace_id,
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
