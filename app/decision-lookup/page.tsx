import { DecisionLookupForm } from "@/components/DecisionLookupForm";
import type { DecisionLookupMode } from "@/lib/types";

type DecisionLookupPageProps = {
  searchParams?: {
    signal_id?: string;
    mode?: string;
  };
};

export default function DecisionLookupPage({ searchParams }: DecisionLookupPageProps) {
  const initialSignalId = searchParams?.signal_id?.trim() ?? "";
  const initialMode =
    searchParams?.mode === "trace_id" || searchParams?.mode === "correlation_id"
      ? (searchParams.mode as DecisionLookupMode)
      : "signal_id";

  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">Read-only retrieval</span>
        <h1>Look up a signal decision.</h1>
        <p>
          This page reads back one submitted decision by exact signal_id, trace_id, or
          correlation_id through the live enforced core retrieval lane. It stays read-only and
          shows found, not-found, and system error truth clearly.
        </p>
      </section>

      <DecisionLookupForm initialSignalId={initialSignalId} initialMode={initialMode} />
    </main>
  );
}
