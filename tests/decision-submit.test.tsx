import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DecisionSubmitPage from "@/app/decision-submit/page";

const originalFetch = global.fetch;
const originalCrypto = global.crypto;

function createJsonResponse(body: unknown, ok: boolean, status: number): Response {
  return {
    ok,
    status,
    json: async () => body
  } as Response;
}

describe("Decision submission page", () => {
  beforeEach(() => {
    let callCount = 0;

    Object.defineProperty(global, "crypto", {
      configurable: true,
      value: {
        randomUUID: () => {
          callCount += 1;
          return callCount === 1
            ? "11111111-1111-4111-8111-111111111111"
            : "00000000-0000-0000-0000-000000000111";
        }
      }
    });

    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: originalFetch
    });

    Object.defineProperty(global, "crypto", {
      configurable: true,
      value: originalCrypto
    });
  });

  it("renders a successful decision submission with the returned traceability fields", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);

    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: true,
          data: {
            signal_id: "11111111-1111-4111-8111-111111111111",
            submitted: true,
            target_service: "core",
            target_endpoint: "/v1/signals/11111111-1111-4111-8111-111111111111/decision",
            trace_id: "trace-console-001",
            correlation_id: "00000000-0000-0000-0000-000000000111"
          },
          meta: {
            confidence_band: "confirmed",
            warnings: [],
            trace_id: "trace-console-001",
            correlation_id: "00000000-0000-0000-0000-000000000111",
            audit: {
              schema: {
                contractVersion: "v1",
                schemaName: "decisionSubmissionResult",
                schemaRevision: 0,
                packageVersion: "0.1.0"
              },
              trace: {
                request_id: "req-1",
                trace_id: "trace-console-001",
                correlation_id: "00000000-0000-0000-0000-000000000111",
                actor_service: "core",
                environment: "local"
              },
              recorded_at: "2026-04-02T01:07:11.448138Z",
              tags: []
            }
          }
        },
        true,
        200
      )
    );

    render(<DecisionSubmitPage />);

    await user.type(
      screen.getByLabelText(/signal id/i),
      "11111111-1111-4111-8111-111111111111"
    );
    await user.clear(screen.getByLabelText(/baseline confidence/i));
    await user.type(screen.getByLabelText(/baseline confidence/i), "0.72");
    await user.clear(screen.getByLabelText(/confidence delta/i));
    await user.type(screen.getByLabelText(/confidence delta/i), "0.08");
    await user.clear(screen.getByLabelText(/updated confidence/i));
    await user.type(screen.getByLabelText(/updated confidence/i), "0.80");
    await user.selectOptions(screen.getByLabelText(/confidence band/i), "confirmed");
    await user.selectOptions(screen.getByLabelText(/disposition/i), "escalate");
    await user.clear(screen.getByLabelText(/reasoning/i));
    await user.type(screen.getByLabelText(/reasoning/i), "console happy path reasoning");

    await user.click(screen.getByRole("button", { name: /submit decision/i }));

    await waitFor(() =>
      expect(screen.getByText("Submission accepted")).toBeInTheDocument()
    );

    const resultPanel = screen
      .getByRole("heading", { name: "Submission result" })
      .closest("aside");

    expect(resultPanel).not.toBeNull();

    const result = within(resultPanel as HTMLElement);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/decision-submit",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(result.getByText("11111111-1111-4111-8111-111111111111")).toBeInTheDocument();
    expect(result.getByText("trace-console-001")).toBeInTheDocument();
    expect(result.getByText("00000000-0000-0000-0000-000000000111")).toBeInTheDocument();
    expect(result.getByText("escalate")).toBeInTheDocument();
    expect(result.getByText("0.720 -> 0.800 (confirmed, delta 0.080)")).toBeInTheDocument();
    expect(result.getByText("console happy path reasoning")).toBeInTheDocument();
  });

  it("renders backend validation failure truth without swallowing the error details", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);

    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error: {
            code: "CONTRACT_VALIDATION_FAILED",
            message: "payload failed schema validation for signalDecision",
            trace_id: "trace-console-bad-001",
            retryable: false,
            details: {
              schema: "signalDecision",
              violations: [
                {
                  expected: "required",
                  field: "baseline_confidence",
                  issue: "missing",
                  received: null
                }
              ]
            }
          },
          meta: {
            warnings: [],
            trace_id: "trace-console-bad-001",
            correlation_id: "00000000-0000-0000-0000-000000000112",
            audit: {
              schema: {
                contractVersion: "v1",
                schemaName: "signalDecision",
                schemaRevision: 0,
                packageVersion: "0.1.0"
              },
              trace: {
                request_id: "req-2",
                trace_id: "trace-console-bad-001",
                correlation_id: "00000000-0000-0000-0000-000000000112",
                actor_service: "core",
                environment: "local"
              },
              recorded_at: "2026-04-02T01:07:09.674207Z",
              tags: []
            }
          }
        },
        false,
        400
      )
    );

    render(<DecisionSubmitPage />);

    await user.type(
      screen.getByLabelText(/signal id/i),
      "11111111-1111-4111-8111-111111111112"
    );

    await user.click(screen.getByRole("button", { name: /submit decision/i }));

    await waitFor(() => expect(screen.getByText("Validation failure")).toBeInTheDocument());

    const resultPanel = screen
      .getByRole("heading", { name: "Submission result" })
      .closest("aside");

    expect(resultPanel).not.toBeNull();

    const result = within(resultPanel as HTMLElement);

    expect(result.getByText("CONTRACT_VALIDATION_FAILED")).toBeInTheDocument();
    expect(
      result.getByText("payload failed schema validation for signalDecision")
    ).toBeInTheDocument();
    expect(result.getByText("trace-console-bad-001")).toBeInTheDocument();
    expect(result.getByText("00000000-0000-0000-0000-000000000112")).toBeInTheDocument();
    expect(result.getByText(/baseline_confidence/i)).toBeInTheDocument();
  });
});
