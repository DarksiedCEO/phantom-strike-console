"use client";

import { useState, useTransition } from "react";

import { DecisionLookupResult } from "@/components/DecisionLookupResult";
import type { DecisionLookupMode, LookupUiState } from "@/lib/types";

type DecisionLookupFormProps = {
  initialSignalId?: string;
  initialMode?: DecisionLookupMode;
};

const LOOKUP_LABELS: Record<DecisionLookupMode, string> = {
  signal_id: "Signal ID",
  trace_id: "Trace ID",
  correlation_id: "Correlation ID"
};

export function DecisionLookupForm({
  initialSignalId = "",
  initialMode = "signal_id"
}: DecisionLookupFormProps) {
  const [mode, setMode] = useState<DecisionLookupMode>(initialMode);
  const [lookupValue, setLookupValue] = useState(initialSignalId);
  const [result, setResult] = useState<LookupUiState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const lookupMode = String(formData.get("mode") ?? "signal_id") as DecisionLookupMode;
    const value = String(formData.get("value") ?? "").trim();
    if (!value) {
      setResult({
        kind: "not-found",
        status: 400,
        body: {
          success: false,
          error: {
            code: "INVALID_LOOKUP_QUERY",
            message: `${LOOKUP_LABELS[lookupMode]} is required.`,
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
          `/api/decision-lookup?mode=${encodeURIComponent(lookupMode)}&value=${encodeURIComponent(value)}`,
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
              <div className="field">
                <label htmlFor="mode">Lookup mode</label>
                <select
                  id="mode"
                  name="mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as DecisionLookupMode)}
                >
                  <option value="signal_id">signal_id</option>
                  <option value="trace_id">trace_id</option>
                  <option value="correlation_id">correlation_id</option>
                </select>
              </div>
              <div className="fieldWide">
                <label htmlFor="value">{LOOKUP_LABELS[mode]}</label>
                <input
                  id="value"
                  name="value"
                  placeholder={
                    mode === "signal_id"
                      ? "df1eab71-aa5f-4ce2-9915-64ccf314e3b9"
                      : mode === "trace_id"
                        ? "trace-contract-smoke-001"
                        : "00000000-0000-0000-0000-000000000001"
                  }
                  required
                  value={lookupValue}
                  onChange={(event) => setLookupValue(event.target.value)}
                />
                <div className="helper">
                  {mode === "signal_id"
                    ? "Lookup is keyed by the canonical signal UUID."
                    : mode === "trace_id"
                      ? "Lookup is keyed by the exact trace_id returned by the enforced lane."
                      : "Lookup is keyed by the exact correlation_id returned by the enforced lane."}
                </div>
              </div>
            </div>

            <div className="actions">
              <div className="statusNote">
                Console Phase 5 stays exact-match only and does not do fuzzy search or history.
              </div>
              <button className="submitButton" type="submit" disabled={isPending}>
                {isPending ? "Looking up..." : "Look up decision"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <DecisionLookupResult result={result} lookupMode={mode} lookupValue={lookupValue.trim()} />
    </section>
  );
}
