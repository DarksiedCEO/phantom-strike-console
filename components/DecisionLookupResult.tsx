"use client";

import type { ErrorEnvelope, LookupSuccessEnvelope, LookupUiState } from "@/lib/types";

type DecisionLookupResultProps = {
  result: LookupUiState;
  signalId: string;
};

function renderConfidenceSummary(body: LookupSuccessEnvelope) {
  const decision = body.data;
  return `${decision.baseline_confidence.toFixed(3)} -> ${decision.updated_confidence.toFixed(3)} (${decision.confidence_band}, delta ${decision.confidence_delta.toFixed(3)})`;
}

function renderPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function DecisionLookupResult({ result, signalId }: DecisionLookupResultProps) {
  function renderIdle() {
    return (
      <div className="resultState">
        <span className="badge badgeIdle">Idle</span>
        <p className="panelCopy">
          Retrieval truth will render here. Lookup is read-only and keyed only by the exact
          signal_id already accepted by core.
        </p>
        <div className="kvList">
          <div className="kvRow">
            <span className="kvLabel">Lookup key</span>
            <p className="kvValue kvValueMono">{signalId || "none yet"}</p>
          </div>
        </div>
      </div>
    );
  }

  function renderFound(body: LookupSuccessEnvelope) {
    return (
      <div className="resultState">
        <span className="badge badgeSuccess">Decision found</span>
        <div className="kvList">
          <div className="kvRow">
            <span className="kvLabel">Signal ID</span>
            <p className="kvValue kvValueMono">{body.data.signal_id}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Disposition</span>
            <p className="kvValue">{body.data.disposition}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Confidence</span>
            <p className="kvValue">{renderConfidenceSummary(body)}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Reasoning</span>
            <p className="kvValue">{body.data.reasoning}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Trace ID</span>
            <p className="kvValue kvValueMono">{body.data.trace_id}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Correlation ID</span>
            <p className="kvValue kvValueMono">{body.data.correlation_id}</p>
          </div>
        </div>
        <pre className="codeBlock">{renderPrettyJson(body)}</pre>
      </div>
    );
  }

  function renderNotFound(body: ErrorEnvelope) {
    return (
      <div className="resultState">
        <span className="badge badgeError">Decision not found</span>
        <div className="kvList">
          <div className="kvRow">
            <span className="kvLabel">Error code</span>
            <p className="kvValue">{body.error.code}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Message</span>
            <p className="kvValue">{body.error.message}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Lookup signal ID</span>
            <p className="kvValue kvValueMono">{signalId}</p>
          </div>
        </div>
        <pre className="codeBlock">{renderPrettyJson(body)}</pre>
      </div>
    );
  }

  function renderSystemError(message: string) {
    return (
      <div className="resultState">
        <span className="badge badgeError">Lookup failed</span>
        <p className="panelCopy">
          This is a transport or system failure, not a found/not-found retrieval result.
        </p>
        <pre className="codeBlock">{message}</pre>
      </div>
    );
  }

  return (
    <aside className="panel">
      <div className="panelInner">
        <h2 className="panelTitle">Lookup result</h2>
        <p className="panelCopy">
          Found, not-found, and system failure stay distinct so the UI does not blur backend
          retrieval truth.
        </p>

        {result.kind === "idle" && renderIdle()}
        {result.kind === "loading" && (
          <div className="resultState">
            <span className="badge badgeSubmitting">Loading</span>
            <p className="panelCopy">Retrieving the canonical decision record from core.</p>
          </div>
        )}
        {result.kind === "found" && renderFound(result.body)}
        {result.kind === "not-found" && renderNotFound(result.body)}
        {result.kind === "system-error" && renderSystemError(result.message)}

        <p className="footerNote">
          Console Phase 2 stays read-only and only shows backend retrieval truth.
        </p>
      </div>
    </aside>
  );
}
