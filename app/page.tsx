import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">PhantomStrike Console v0</span>
        <h1>Decision submission over the enforced lane.</h1>
        <p>
          This first console slice is intentionally narrow. It submits one live signal decision
          into the guarded core/workflows backbone and surfaces the exact response truth back to
          the operator.
        </p>
      </section>

      <section className="panel" style={{ marginTop: 22 }}>
        <div className="panelInner">
          <h2 className="panelTitle">Single-path entry</h2>
          <p className="panelCopy">
            Start with the only flow that matters in Console v0: decision submission with visible
            traceability and explicit validation feedback.
          </p>
          <div style={{ marginTop: 18 }}>
            <Link href="/decision-submit">Open Decision Submission</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
