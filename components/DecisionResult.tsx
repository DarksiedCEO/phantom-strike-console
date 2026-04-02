"use client";

import Link from "next/link";

import type {
  DecisionSubmissionRequest,
  ErrorEnvelope,
  SubmissionUiState,
  SuccessEnvelope
} from "@/lib/types";

type DecisionResultProps = {
  result: SubmissionUiState;
  currentPayload: DecisionSubmissionRequest;
};

function renderConfidenceSummary(payload: DecisionSubmissionRequest) {
  return `${payload.baseline_confidence.toFixed(3)} -> ${payload.updated_confidence.toFixed(3)} (${payload.confidence_band}, delta ${payload.confidence_delta.toFixed(3)})`;
}

function renderPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function DecisionResult({ result, currentPayload }: DecisionResultProps) {
  function renderIdle() {
    return (
      <div className="resultState">
        <span className="badge badgeIdle">Idle</span>
        <p className="panelCopy">
          Submission truth will render here. Success preserves the live traceability fields from
          core. Validation failures surface backend details directly instead of hiding them.
        </p>
        <div className="kvList">
          <div className="kvRow">
            <span className="kvLabel">Prepared trace ID</span>
            <p className="kvValue kvValueMono">{currentPayload.trace_id}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Prepared correlation ID</span>
            <p className="kvValue kvValueMono">{currentPayload.correlation_id}</p>
          </div>
        </div>
      </div>
    );
  }

  function renderSuccess(body: SuccessEnvelope) {
    return (
      <div className="resultState">
        <span className="badge badgeSuccess">Submission accepted</span>
        <div className="kvList">
          <div className="kvRow">
            <span className="kvLabel">Signal ID</span>
            <p className="kvValue kvValueMono">{body.data.signal_id}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Disposition</span>
            <p className="kvValue">{currentPayload.disposition}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Confidence</span>
            <p className="kvValue">{renderConfidenceSummary(currentPayload)}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Reasoning</span>
            <p className="kvValue">{currentPayload.reasoning}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Trace ID</span>
            <p className="kvValue kvValueMono">{body.data.trace_id}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Correlation ID</span>
            <p className="kvValue kvValueMono">{body.data.correlation_id}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Target endpoint</span>
            <p className="kvValue kvValueMono">{body.data.target_endpoint}</p>
          </div>
        </div>
        <div className="inlineActionRow">
          <Link
            className="inlineActionLink"
            href={`/decision-lookup?signal_id=${encodeURIComponent(body.data.signal_id)}`}
          >
            View submitted decision
          </Link>
        </div>
        <pre className="codeBlock">{renderPrettyJson(body)}</pre>
      </div>
    );
  }

  function renderFailure(body: ErrorEnvelope) {
    return (
      <div className="resultState">
        <span className="badge badgeError">Validation failure</span>
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
            <span className="kvLabel">Trace ID</span>
            <p className="kvValue kvValueMono">{body.error.trace_id}</p>
          </div>
          <div className="kvRow">
            <span className="kvLabel">Correlation ID</span>
            <p className="kvValue kvValueMono">{body.meta?.correlation_id ?? "unavailable"}</p>
          </div>
        </div>
        <pre className="codeBlock">{renderPrettyJson(body)}</pre>
      </div>
    );
  }

  function renderSystemError(message: string) {
    return (
      <div className="resultState">
        <span className="badge badgeError">Request failed</span>
        <p className="panelCopy">
          This is a transport or system failure, not a contract validation result.
        </p>
        <pre className="codeBlock">{message}</pre>
      </div>
    );
  }

  return (
    <aside className="panel">
      <div className="panelInner">
        <h2 className="panelTitle">Submission result</h2>
        <p className="panelCopy">
          Success, validation failure, and system failure are kept distinct so the UI does not
          blur backend truth.
        </p>

        {result.kind === "idle" && renderIdle()}
        {result.kind === "submitting" && (
          <div className="resultState">
            <span className="badge badgeSubmitting">Submitting</span>
            <p className="panelCopy">
              Sending the flat decision payload through the proxy route into core.
            </p>
          </div>
        )}
        {result.kind === "success" && renderSuccess(result.body)}
        {result.kind === "validation-error" && renderFailure(result.body)}
        {result.kind === "system-error" && renderSystemError(result.message)}

        <p className="footerNote">
          Console v0 intentionally exposes backend truth instead of trying to smooth it over.
        </p>
      </div>
    </aside>
  );
}
