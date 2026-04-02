import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DecisionLookupPage from "@/app/decision-lookup/page";

const originalFetch = global.fetch;

function createJsonResponse(body: unknown, ok: boolean, status: number): Response {
  return {
    ok,
    status,
    json: async () => body
  } as Response;
}

describe("Decision lookup page", () => {
  beforeEach(() => {
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
  });

  it("renders a found decision record from the retrieval lane", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);

    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: true,
          data: {
            signal_id: "11111111-1111-4111-8111-111111111111",
            baseline_confidence: 0.62,
            confidence_delta: 0.128,
            updated_confidence: 0.748,
            confidence_band: "elevated",
            disposition: "escalate",
            reasoning: "retrieved decision reasoning",
            trace_id: "trace-lookup-001",
            correlation_id: "00000000-0000-0000-0000-000000000221"
          },
          meta: {
            confidence_band: "elevated",
            warnings: [],
            trace_id: "trace-lookup-001",
            correlation_id: "00000000-0000-0000-0000-000000000221",
            audit: {
              schema: {
                contractVersion: "v1",
                schemaName: "signal-decision-record",
                schemaRevision: 0,
                packageVersion: "0.1.0"
              },
              trace: {
                request_id: "req-lookup-1",
                trace_id: "trace-lookup-001",
                correlation_id: "00000000-0000-0000-0000-000000000221",
                actor_service: "core",
                environment: "local"
              },
              recorded_at: "2026-04-02T01:00:00Z",
              tags: []
            }
          }
        },
        true,
        200
      )
    );

    render(<DecisionLookupPage />);

    await user.type(
      screen.getByLabelText(/signal id/i),
      "11111111-1111-4111-8111-111111111111"
    );
    await user.click(screen.getByRole("button", { name: /look up decision/i }));

    await waitFor(() => expect(screen.getByText("Decision found")).toBeInTheDocument());

    const resultPanel = screen
      .getByRole("heading", { name: "Lookup result" })
      .closest("aside");

    expect(resultPanel).not.toBeNull();

    const result = within(resultPanel as HTMLElement);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/decision-lookup?signal_id=11111111-1111-4111-8111-111111111111",
      expect.objectContaining({
        method: "GET"
      })
    );
    expect(result.getByText("11111111-1111-4111-8111-111111111111")).toBeInTheDocument();
    expect(result.getByText("trace-lookup-001")).toBeInTheDocument();
    expect(result.getByText("00000000-0000-0000-0000-000000000221")).toBeInTheDocument();
    expect(result.getByText("escalate")).toBeInTheDocument();
    expect(result.getByText("0.620 -> 0.748 (elevated, delta 0.128)")).toBeInTheDocument();
    expect(result.getByText("retrieved decision reasoning")).toBeInTheDocument();
  });

  it("renders a clean not-found state for an unknown signal id", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);

    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error: {
            code: "SIGNAL_DECISION_NOT_FOUND",
            message: "no decision record found for the requested signal_id",
            trace_id: "trace-lookup-miss-001",
            retryable: false,
            details: {
              lookup: {
                field: "signal_id",
                value: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
              }
            }
          },
          meta: {
            warnings: [],
            trace_id: "trace-lookup-miss-001",
            correlation_id: "00000000-0000-0000-0000-000000000222",
            audit: {
              schema: {
                contractVersion: "v1",
                schemaName: "signalDecisionRecord",
                schemaRevision: 0,
                packageVersion: "0.1.0"
              },
              trace: {
                request_id: "req-lookup-2",
                trace_id: "trace-lookup-miss-001",
                correlation_id: "00000000-0000-0000-0000-000000000222",
                actor_service: "core",
                environment: "local"
              },
              recorded_at: "2026-04-02T01:00:00Z",
              tags: []
            }
          }
        },
        false,
        404
      )
    );

    render(<DecisionLookupPage />);

    await user.type(
      screen.getByLabelText(/signal id/i),
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    );
    await user.click(screen.getByRole("button", { name: /look up decision/i }));

    await waitFor(() => expect(screen.getByText("Decision not found")).toBeInTheDocument());

    const resultPanel = screen
      .getByRole("heading", { name: "Lookup result" })
      .closest("aside");

    expect(resultPanel).not.toBeNull();

    const result = within(resultPanel as HTMLElement);

    expect(result.getByText("SIGNAL_DECISION_NOT_FOUND")).toBeInTheDocument();
    expect(
      result.getByText("no decision record found for the requested signal_id")
    ).toBeInTheDocument();
    expect(
      result.getByText("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
    ).toBeInTheDocument();
  });
});
