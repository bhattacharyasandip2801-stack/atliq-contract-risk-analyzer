import Link from "next/link";

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <li className="rounded-lg border border-rule bg-paper p-4">
    <h3 className="text-base font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-muted">{children}</p>
  </li>
);

/** Home page: what the product does, why, and how it helps the business. Shown at "/" before sign-in and at /about when signed in.
 *  Every figure comes from the project documents or the stored briefs. */
export default function Home({ signedIn }: { signedIn: boolean }) {
  const cta = signedIn
    ? <Link href="/" className="inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-nav hover:opacity-90">Go to the Contract Dashboard →</Link>
    : <Link href="/signin" className="inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-nav hover:opacity-90">Open the demo →</Link>;
  return (
    <div className="grid gap-8">
      <section className="rounded-xl bg-nav p-6 text-white sm:p-10" aria-label="Overview">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-sm font-bold" aria-hidden="true">Q</span>
          <span className="text-sm font-semibold">AtliQ Contract Risk Analyzer</span>
        </div>
        <h1 style={{ color: "#fff" }} className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">Know what you are signing before you sign it.</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
          AtliQ has no legal team, so its CEO reads every client and partner contract himself. This tool reads each incoming draft first and gives him a short,
          ranked brief: what to decide before signing, what to negotiate, and exactly which clause says so.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">{cta}<span className="text-sm text-white/70">Prototype on synthetic data. Not legal advice.</span></div>
      </section>

      <section className="card rounded-lg border border-rule bg-card p-5" aria-label="The problem">
        <h2 className="sec-h">The problem it solves</h2>
        <p className="max-w-3xl text-sm leading-relaxed">
          A client-paper master services agreement takes Karandeep three to four hours to read, often late in the evening. One contract signed in a hurry, with uncapped delay damages,
          led to an $18,400 claim and a $14,200 legal bill. The hard part is not reading the words. It is knowing what a signature collides with: promises AtliQ has already made to
          other clients, caps that are far larger than the deal, and one-sided terms buried in boilerplate.
        </p>
      </section>

      <section className="card rounded-lg border border-rule bg-card p-5" aria-label="What it does">
        <h2 className="sec-h">What it does</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          <Card title="Catches clashes with signed promises">It keeps a register of the restrictions AtliQ has agreed in its signed contracts (17 so far) and shows a new draft clause next to the signed clause it collides with.</Card>
          <Card title="Puts a number on the exposure">For example, a delay-damages clause of 2% a day on a $210,000 contract is shown as $4,200 a day, with the arithmetic and whether any cap exists.</Card>
          <Card title="Shows the exact words">Every finding quotes the contract and says which rule or earlier contract it comes from. Each quote is re-checked against its source file, and a finding whose quote does not match is withheld.</Card>
          <Card title="Says what it did not check">Anything it cannot read is listed as NOT CHECKED, so a quiet brief never means a clean contract.</Card>
          <Card title="Keeps the decision on record">Karandeep chooses Accept, Negotiate, Reject or Override on each finding, and the log keeps who decided, when and why.</Card>
          <Card title="Leaves the signing to people">It never signs, sends or gives legal advice. Possible conflicts are marked for counsel to confirm.</Card>
        </ul>
      </section>

      <section className="card rounded-lg border border-rule bg-card p-5" aria-label="How it helps the business">
        <h2 className="sec-h">How it helps the business</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          <Card title="Hours of reading become a short checklist">Each brief lists every finding on one screen. The client&apos;s target is a decision in under 5 minutes per contract; this has not been measured yet.</Card>
          <Card title="Costly clashes are caught before signature">The Gulf Crown draft, for example, falls inside a Gulf restriction in the signed Al Noor contract that runs to about September 2029.</Card>
          <Card title="Exceptions become deliberate">With a recorded reason on every decision, a waived clause is a choice someone made, not an accident nobody noticed.</Card>
          <Card title="Knows when to ask a lawyer">Findings that may need a legal opinion are marked for counsel, so Karandeep can see when to ask and when he can decide himself.</Card>
          <Card title="Low running cost">Live analysis is estimated at under ten cents a review (cost sheet). The prototype itself makes no model calls.</Card>
          <Card title="Sellers get answers without seeing other clients&apos; terms">A seller sees flags and questions on the drafts they requested. What AtliQ signed with other clients stays hidden.</Card>
        </ul>
      </section>

      <section className="card rounded-lg border border-rule bg-card p-5" aria-label="How it works">
        <h2 className="sec-h">How it works</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          <li className="rounded-lg border border-rule bg-paper p-4"><div className="text-xs font-semibold text-accent">1. A draft arrives</div><p className="mt-1 text-sm text-muted">The Contract Dashboard lists incoming drafts by due date and puts the most urgent first.</p></li>
          <li className="rounded-lg border border-rule bg-paper p-4"><div className="text-xs font-semibold text-accent">2. A ranked brief</div><p className="mt-1 text-sm text-muted">Findings are grouped as Decide before signing, Negotiate and For your information, each with its quote and clause.</p></li>
          <li className="rounded-lg border border-rule bg-paper p-4"><div className="text-xs font-semibold text-accent">3. A recorded decision</div><p className="mt-1 text-sm text-muted">Karandeep decides each finding. Counsel confirms the ones flagged for them. A person signs.</p></li>
        </ol>
        <p className="mt-3 text-sm text-muted">You can also paste a new draft for a quick rule check, or search everything AtliQ has written about contracts in the Knowledge base.</p>
      </section>

      <section className="card rounded-lg border border-medium/40 bg-card p-5" aria-label="Prototype status">
        <h2 className="sec-h">Where this prototype stands</h2>
        <ul className="grid gap-1.5 text-sm">
          <li>It runs on 15 synthetic incoming drafts and 17 signed contracts from the capstone dataset, with briefs prepared in advance.</li>
          <li>Its checks cover what the project labelled. Karandeep and counsel have not yet confirmed those labels, so it does not prove accuracy on contracts it has not seen.</li>
          <li>Not built yet: masking of confidential terms, live analysis of new contracts, and the register for the other signed contracts.</li>
        </ul>
        <div className="mt-4">{signedIn
          ? <Link href="/" className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Go to the Contract Dashboard →</Link>
          : <Link href="/signin" className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Open the demo →</Link>}</div>
      </section>
    </div>
  );
}
