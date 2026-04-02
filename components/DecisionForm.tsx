"use client";

import { useState, useTransition } from "react";

import { DecisionResult } from "@/components/DecisionResult";
import type {
  DecisionConfidenceBand,
  DecisionDisposition,
  DecisionSubmissionRequest,
  SubmissionUiState
} from "@/lib/types";

const DEFAULT_FORM = {
  signal_id: "",
  baseline_confidence: "0.62",
  confidence_delta: "0.128",
  updated_confidence: "0.748",
  confidence_band: "elevated" as DecisionConfidenceBand,
  disposition: "escalate" as DecisionDisposition,
  reasoning: "Supporting evidence outweighed contradiction after adversarial penalty."
};

function makeIds() {
  return {
    traceId: `trace-console-${crypto.randomUUID().slice(0, 8)}`,
    correlationId: crypto.randomUUID()
  };
}

export function DecisionForm() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [ids, setIds] = useState(makeIds);
  const [result, setResult] = useState<SubmissionUiState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function updateField(name: keyof typeof DEFAULT_FORM, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetIds() {
    setIds(makeIds());
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
  }

  function buildPayload(): DecisionSubmissionRequest {
    return {
      signal_id: form.signal_id.trim(),
      baseline_confidence: Number(form.baseline_confidence),
      confidence_delta: Number(form.confidence_delta),
      updated_confidence: Number(form.updated_confidence),
      confidence_band: form.confidence_band,
      disposition: form.disposition,
      reasoning: form.reasoning.trim(),
      trace_id: ids.traceId,
      correlation_id: ids.correlationId
    };
  }

  function submit(formData: FormData) {
    const signalId = String(formData.get("signal_id") ?? "").trim();
    if (!signalId) {
      setResult({
        kind: "validation-error",
        status: 400,
        body: {
          success: false,
          error: {
            code: "CLIENT_VALIDATION_FAILED",
            message: "signal_id is required before submitting.",
            trace_id: ids.traceId,
            retryable: false
          }
        }
      });
      return;
    }

    startTransition(async () => {
      setResult({ kind: "submitting" });

      const payload = buildPayload();

      try {
        const response = await fetch("/api/decision-submit", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const body = await response.json();

        if (response.ok) {
          setResult({ kind: "success", status: response.status, body });
          setIds(makeIds());
          return;
        }

        setResult({ kind: "validation-error", status: response.status, body });
      } catch (error) {
        setResult({
          kind: "system-error",
          message: error instanceof Error ? error.message : "Unknown request failure"
        });
      }
    });
  }

  return (
    <section className="grid">
      <div className="panel">
        <div className="panelInner">
          <h2 className="panelTitle">Decision form</h2>
          <p className="panelCopy">
            Submit one flat decision payload into the live enforced core endpoint. Client-side
            checks stay shallow; the server remains the contract truth.
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
                  value={form.signal_id}
                  onChange={(event) => updateField("signal_id", event.target.value)}
                />
                <div className="helper">Use the exact signal UUID expected by the core endpoint.</div>
              </div>

              <div className="field">
                <label htmlFor="baseline_confidence">Baseline confidence</label>
                <input
                  id="baseline_confidence"
                  name="baseline_confidence"
                  type="number"
                  min="0"
                  max="1"
                  step="0.001"
                  value={form.baseline_confidence}
                  onChange={(event) => updateField("baseline_confidence", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="confidence_delta">Confidence delta</label>
                <input
                  id="confidence_delta"
                  name="confidence_delta"
                  type="number"
                  min="-1"
                  max="1"
                  step="0.001"
                  value={form.confidence_delta}
                  onChange={(event) => updateField("confidence_delta", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="updated_confidence">Updated confidence</label>
                <input
                  id="updated_confidence"
                  name="updated_confidence"
                  type="number"
                  min="0"
                  max="1"
                  step="0.001"
                  value={form.updated_confidence}
                  onChange={(event) => updateField("updated_confidence", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="confidence_band">Confidence band</label>
                <select
                  id="confidence_band"
                  name="confidence_band"
                  value={form.confidence_band}
                  onChange={(event) =>
                    updateField("confidence_band", event.target.value as DecisionConfidenceBand)
                  }
                >
                  <option value="low">low</option>
                  <option value="guarded">guarded</option>
                  <option value="elevated">elevated</option>
                  <option value="confirmed">confirmed</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="disposition">Disposition</label>
                <select
                  id="disposition"
                  name="disposition"
                  value={form.disposition}
                  onChange={(event) =>
                    updateField("disposition", event.target.value as DecisionDisposition)
                  }
                >
                  <option value="promote">promote</option>
                  <option value="hold">hold</option>
                  <option value="suppress">suppress</option>
                  <option value="escalate">escalate</option>
                </select>
              </div>

              <div className="fieldWide">
                <label htmlFor="reasoning">Reasoning</label>
                <textarea
                  id="reasoning"
                  name="reasoning"
                  value={form.reasoning}
                  onChange={(event) => updateField("reasoning", event.target.value)}
                />
              </div>
            </div>

            <div className="idRail">
              <div className="idCard">
                <div>
                  <p className="idCardLabel">Trace ID</p>
                  <p className="idCardValue">{ids.traceId}</p>
                </div>
                <button
                  className="copyButton"
                  type="button"
                  onClick={() => copyValue(ids.traceId)}
                >
                  Copy trace
                </button>
              </div>

              <div className="idCard">
                <div>
                  <p className="idCardLabel">Correlation ID</p>
                  <p className="idCardValue">{ids.correlationId}</p>
                </div>
                <button
                  className="copyButton"
                  type="button"
                  onClick={() => copyValue(ids.correlationId)}
                >
                  Copy correlation
                </button>
              </div>
            </div>

            <div className="actions">
              <div className="statusNote">
                IDs are generated by default for v0. Reset them if you want a fresh trace lineage
                before submitting.
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="copyButton" type="button" onClick={resetIds}>
                  Regenerate IDs
                </button>
                <button className="submitButton" type="submit" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit decision"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DecisionResult result={result} currentPayload={buildPayload()} />
    </section>
  );
}
