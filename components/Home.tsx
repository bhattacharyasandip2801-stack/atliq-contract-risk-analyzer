import Link from "next/link";

/** Home page: what the product does, who it helps and why it can be trusted. Shown at "/" before sign-in and at /about when signed in.
 *  Generic by design: no names, amounts or real contract scenarios. Facts below describe how the product behaves. */

const Kicker = ({ children }: { children: React.ReactNode }) => <div className="text-xs font-semibold uppercase tracking-widest text-accent">{children}</div>;
const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="mt-2 max-w-3xl text-2xl font-bold leading-tight sm:text-3xl">{children}</h2>;
const Sub = ({ children }: { children: React.ReactNode }) => <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{children}</p>;
const Tile = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <li className="rounded-xl border border-rule bg-card p-5 shadow-sm">
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-bg text-base text-accent" aria-hidden="true">{icon}</span>
    <h3 className="mt-3 text-base font-semibold">{title}</h3>
    <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>
  </li>
);
const FAQ: [string, string][] = [
  ["Does it replace a lawyer?", "No. It never gives legal advice. It points to the clauses that deserve attention and marks possible conflicts for counsel to confirm."],
  ["Does it sign or send anything?", "No. It never signs, sends or approves. A person reads the findings, records a decision with a reason, and a person signs."],
  ["What if it cannot read something?", "It says so. Anything it could not check is listed as NOT CHECKED, so a quiet brief never means a clean contract."],
  ["How do I know a finding is real?", "Every finding quotes the contract word for word and names the rule or earlier contract it relies on. Each quote is re-checked against its source file, and a finding whose quote does not match is withheld."],
  ["Who sees what?", "A reviewer sees everything. A seller sees flags and questions on the drafts they requested, and what was agreed with other clients stays hidden."],
  ["What is this prototype built on?", "Synthetic sample contracts only, with briefs prepared in advance. It makes no AI model calls, and decisions stay in your browser."],
];

export default function Home({ signedIn }: { signedIn: boolean }) {
  const href = signedIn ? "/" : "/signin";
  const label = signedIn ? "Go to the Contract Dashboard" : "Open the demo";
  return (
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0">
      {!signedIn && (
        <header className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule bg-card/95 px-4 py-3 backdrop-blur sm:rounded-b-xl">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-nav text-sm font-bold text-white" aria-hidden="true">Q</span>
            <span className="text-sm font-semibold">AtliQ Contract Risk Analyzer</span>
          </div>
          <nav aria-label="On this page" className="hidden items-center gap-5 text-sm text-muted md:flex">
            <a className="py-2 hover:text-ink" href="#how">How it works</a><a className="py-2 hover:text-ink" href="#features">Features</a><a className="py-2 hover:text-ink" href="#trust">Trust</a><a className="py-2 hover:text-ink" href="#faq">FAQ</a>
          </nav>
          <Link href={href} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">{label}</Link>
        </header>
      )}

      {/* Hero */}
      <section aria-label="Overview" className="px-4 pb-12 pt-12 sm:px-2 sm:pt-16">
        <div className="max-w-3xl">
          <div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">Know what you are signing, before you sign it.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Every incoming contract gets a short, ranked brief: what to decide before signing, what to negotiate, and the exact clause behind each point.
              People stay in charge of every decision.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={href} className="rounded-md bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm hover:opacity-90">{label} →</Link>
              {!signedIn && <a href="#how" className="rounded-md border border-rule bg-card px-6 py-3 text-base font-semibold hover:bg-accent-bg">See how it works</a>}
            </div>
            <p className="mt-4 text-sm text-muted">Prototype on synthetic data. Not legal advice.</p>
          </div>

        </div>
      </section>

      {/* Proof strip */}
      <section aria-label="What you can rely on" className="border-y border-rule bg-card px-4 py-6 sm:px-2">
        <ul className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[["Every finding quotes the contract", "Word for word, with the clause number."], ["Every quote is re-checked", "Against its source file, every time."], ["Every decision is recorded", "Who decided, when and why."], ["A person always signs", "It never signs, sends or advises."]].map(([t, d]) => (
            <li key={t}><div className="font-semibold">{t}</div><div className="text-muted">{d}</div></li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how" aria-label="How it works" className="scroll-mt-20 px-4 py-14 sm:px-2">
        <Kicker>How it works</Kicker>
        <H2>From incoming draft to recorded decision in three steps.</H2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[["1", "A draft arrives", "Drafts are listed by due date, with the ones needing a decision first."],
            ["2", "A ranked brief", "Findings are grouped as Decide before signing, Negotiate and For your information, each with its quote and clause."],
            ["3", "A recorded decision", "The reviewer accepts, negotiates, rejects or overrides each finding and gives a reason. Counsel confirms the flagged ones."]].map(([n, t, d]) => (
            <li key={n} className="rounded-xl border border-rule bg-paper p-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-white" aria-hidden="true">{n}</span>
              <h3 className="mt-3 text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section id="features" aria-label="Features" className="scroll-mt-20 border-y border-rule bg-card px-4 py-14 sm:px-2">
        <Kicker>What it does</Kicker>
        <H2>Everything a reviewer needs to decide, in one place.</H2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Tile icon="🔗" title="Catches clashes with earlier promises">Keeps a register of the restrictions agreed in signed contracts and shows a new clause beside the signed clause it collides with.</Tile>
          <Tile icon="🧮" title="Shows the exposure">Works out what a clause could cost per day or per week, shows the arithmetic, and states whether any cap exists.</Tile>
          <Tile icon="🔍" title="Quotes, never paraphrases">Each finding cites the exact words and the rule or earlier contract behind it.</Tile>
          <Tile icon="🚩" title="Says what it did not check">Anything it cannot read is listed as NOT CHECKED rather than guessed.</Tile>
          <Tile icon="📝" title="Keeps the decision on record">Accept, Negotiate, Reject or Override, with a reason, kept in a log of who, when and why.</Tile>
          <Tile icon="📚" title="Searchable knowledge base">Ask in plain words and read the exact passages from past contracts, notes and checklists.</Tile>
          <Tile icon="⚡" title="Quick check on a new draft">Paste a contract to get a first read in seconds, clearly marked as a rule check and not the full brief.</Tile>
          <Tile icon="👥" title="The right view for each person">Reviewers see everything. Sellers see only flags and questions on their own drafts.</Tile>
          <Tile icon="🖨" title="Ready to share">Print or save any brief as a PDF for a file note or for counsel.</Tile>
        </ul>
      </section>

      {/* Who it helps */}
      <section aria-label="Who it helps" className="px-4 py-14 sm:px-2">
        <Kicker>Who it helps</Kicker>
        <H2>Faster for the person who signs, safer for everyone else.</H2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {[["Leaders without a legal team", "Start from a short checklist of what to decide, not from page one of the contract."],
            ["Sales and account teams", "Get clear flags and questions on their own drafts without waiting for a full read."],
            ["Counsel and advisers", "Spend time only on the points marked for them, with the quotes and clause numbers already pulled."]].map(([t, d]) => (
            <li key={t} className="rounded-xl border border-rule bg-card p-5"><h3 className="text-base font-semibold">{t}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{d}</p></li>
          ))}
        </ul>
      </section>

      {/* Trust */}
      <section id="trust" aria-label="Trust and safety" className="scroll-mt-20 border-y border-rule bg-card px-4 py-14 sm:px-2">
        <Kicker>Trust and safety</Kicker>
        <H2>Built to be checked, not taken on faith.</H2>
        <Sub>The product is designed so a reviewer can verify every point and a person always makes the call.</Sub>
        <ul className="mt-8 grid gap-3 text-sm md:grid-cols-2">
          {["Findings with a quote that does not match the source are withheld.", "Uncertain areas are labelled NOT CHECKED, never filled with a guess.", "It never signs, sends, approves or gives legal advice.", "Possible conflicts with signed contracts are marked for counsel.", "Other clients' terms stay hidden from sellers.", "Every view, export and decision is written to an audit log."].map((t) => (
            <li key={t} className="flex gap-3 rounded-lg border border-rule bg-paper p-4"><span className="mt-0.5 text-ok" aria-hidden="true">✓</span><span>{t}</span></li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section id="faq" aria-label="Frequently asked questions" className="scroll-mt-20 px-4 py-14 sm:px-2">
        <Kicker>FAQ</Kicker>
        <H2>Questions people ask first.</H2>
        <div className="mt-6 grid max-w-3xl gap-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-lg border border-rule bg-card p-4"><summary className="font-semibold">{q}</summary><p className="mt-2 text-sm leading-relaxed text-muted">{a}</p></details>
          ))}
        </div>
      </section>

    </div>
  );
}
