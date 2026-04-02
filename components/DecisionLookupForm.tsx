"use client";

import { useState, useTransition } from "react";

import { DecisionLookupResult } from "@/components/DecisionLookupResult";
import type { LookupUiState } from "@/lib/types";

type DecisionLookupFormProps = {
  initialSignalId?: string;
};

export function DecisionLookupForm({ initialSignalId = "" }: DecisionLookupFormProps) {
  const [signalId, setSignalId] = useState(initialSignalId);
  const [result, setResult] = useState<LookupUiState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const lookupSignalId = String(formData.get("signal_id") ?? "").trim();
    if (!lookupSignalId) {
      setResult({
        kind: "not-found",
        status: 400,
        body: {
          success: false,
          error: {
            code: "INVALID_SIGNAL_ID_QUERY",
            message: "signal_id query parameter is required.",
            trace_id: "unavailable",
            retryable: false
          }
        }
      });
      return;
    }

    startTransition(async () => {
      setResult({ kind: "loading" });

      try {
        const response = await fetch(
          `/api/decision-lookup?signal_id=${encodeURIComponent(lookupSignalId)}`,
          {
            method: "GET",
            headers: {
              "content-type": "application/json"
            }
          }
        );

        const body = await response.json();

        if (response.ok) {
          setResult({ kind: "found", status: response.status, body });
          return;
        }

        if (response.status === 404) {
          setResult({ kind: "not-found", status: response.status, body });
          return;
        }

        setResult({
          kind: "system-error",
          message: body?.error?.message ?? "Unknown retrieval failure"
        });
      } catch (error) {
        setResult({
          kind: "system-error",
          message: error instanceof Error ? error.message : "Unknown retrieval failure"
        });
      }
    });
  }

  return (
    <section className="grid">
      <div className="panel">
        <div className="panelInner">
          <h2 className="panelTitle">Decision lookup</h2>
          <p className="panelCopy">
            Read back one persisted decision record by signal_id. This slice is intentionally
            narrow and read-only.
          </p>

          <form action={submit}>
            <div className="formGrid">
              <div className="fieldWide">
                <label htmlFor="signal_id">Signal ID</label>
                <input
                  id="signal_id"
                  name="signal_id"
                  placeholder="df1eab71-aa5f-4ce2-9915-64ccf314e3b9"
                  required
                  value={signalId}
                  onChange={(event) => setSignalId(event.target.value)}
                />
                <div className="helper">Lookup is keyed only by the canonical signal UUID.</div>
              </div>
            </div>

            <div className="actions">
              <div className="statusNote">
                Console Phase 2 does not search by trace or correlation yet.
              </div>
              <button className="submitButton" type="submit" disabled={isPending}>
                {isPending ? "Looking up..." : "Look up decision"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <DecisionLookupResult result={result} signalId={signalId.trim()} />
    </section>
  );
}
