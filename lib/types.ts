export type DecisionConfidenceBand = "low" | "guarded" | "elevated" | "confirmed";
export type DecisionDisposition = "promote" | "hold" | "suppress" | "escalate";

export type DecisionSubmissionRequest = {
  signal_id: string;
  baseline_confidence: number;
  confidence_delta: number;
  updated_confidence: number;
  confidence_band: DecisionConfidenceBand;
  disposition: DecisionDisposition;
  reasoning: string;
  trace_id: string;
  correlation_id: string;
};

export type DecisionSubmissionData = {
  signal_id: string;
  submitted: boolean;
  target_service: string;
  target_endpoint: string;
  trace_id: string;
  correlation_id: string;
};

export type ResponseMeta = {
  confidence_band?: string;
  warnings: string[];
  trace_id: string;
  correlation_id: string;
  audit: {
    schema: {
      contractVersion: string;
      schemaName: string;
      schemaRevision: number;
      packageVersion: string;
    };
    trace: {
      request_id: string;
      trace_id: string;
      correlation_id: string;
      actor_service: string;
      environment: string;
    };
    recorded_at: string;
    tags: string[];
  };
};

export type SuccessEnvelope = {
  success: true;
  data: DecisionSubmissionData;
  meta: ResponseMeta;
};

export type ErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    trace_id: string;
    retryable: boolean;
    details?: unknown;
  };
  meta?: ResponseMeta;
};

export type SubmissionUiState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; status: number; body: SuccessEnvelope }
  | { kind: "validation-error"; status: number; body: ErrorEnvelope }
  | { kind: "system-error"; message: string };
