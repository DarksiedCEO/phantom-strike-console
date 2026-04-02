import { DecisionLookupForm } from "@/components/DecisionLookupForm";

type DecisionLookupPageProps = {
  searchParams?: {
    signal_id?: string;
  };
};

export default function DecisionLookupPage({ searchParams }: DecisionLookupPageProps) {
  const initialSignalId = searchParams?.signal_id?.trim() ?? "";

  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">Read-only retrieval</span>
        <h1>Look up a signal decision.</h1>
        <p>
          This page reads back one submitted decision by signal ID through the live enforced core
          retrieval lane. It stays read-only and shows found, not-found, and system error truth
          clearly.
        </p>
      </section>

      <DecisionLookupForm initialSignalId={initialSignalId} />
    </main>
  );
}
