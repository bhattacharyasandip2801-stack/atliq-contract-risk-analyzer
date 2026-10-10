/** Action wording shown to people. The data model keeps High, Medium and Low. */
export const SEV_LABEL: Record<string, string> = { High: "Decide before signing", Medium: "Negotiate", Low: "For your information", None: "No findings" };
export function SeverityBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    High: "bg-high-bg text-high border-high/30", Medium: "bg-medium-bg text-medium border-medium/30",
    Low: "bg-low-bg text-low border-low/20", None: "bg-ok-bg text-ok border-ok/30",
  };
  const label = SEV_LABEL[s] ?? s;
  return <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${m[s] ?? m.Low}`}>{label}</span>;
}
export function Chip({ children, tone = "plain", title }: { children: React.ReactNode; tone?: "plain" | "accent" | "warn" | "ok"; title?: string }) {
  const t = { plain: "bg-low-bg text-low", accent: "bg-accent-bg text-accent", warn: "bg-medium-bg text-medium", ok: "bg-ok-bg text-ok" }[tone];
  return <span title={title} className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${t}${title ? " cursor-help" : ""}`}>{children}</span>;
}
export const TYPE_LABEL: Record<string, string> = {
  conflict: "Conflict", possible_conflict: "Possible conflict, for counsel", clause_risk: "Clause risk", entity_law: "Entity and law",
  bundle: "Missing document", consistency: "Documents disagree", data_class: "Data type", fairness: "Fairness",
};
/** Plain-language hover text for the finding-type chips. */
export const TYPE_HINT: Record<string, string> = {
  conflict: "This draft clashes with something AtliQ has already signed.",
  possible_conflict: "This may clash with a signed contract. Ask counsel before deciding.",
  clause_risk: "A clause in this draft goes beyond what the checklist allows.",
  entity_law: "The AtliQ company named, or the governing law, does not match the usual setup.",
  bundle: "A document this deal depends on is missing or not signed.",
  consistency: "Two documents in this deal say different things.",
  data_class: "What kind of data is involved, such as patient data, decides how strict the rules are.",
  fairness: "The terms are one-sided compared with what AtliQ treats as fair.",
};
export const EXC_TONE: Record<string, "accent" | "warn" | "plain"> = { deliberate: "accent", waved_through: "warn", unlabelled: "plain" };
export const EXC_LABEL: Record<string, string> = { deliberate: "Deliberate", waved_through: "Waved through", unlabelled: "Unlabelled" };
export const BUNDLE_LABEL: Record<string, { t: string; tone: "ok" | "warn" | "plain" }> = {
  signed: { t: "Signed", tone: "ok" }, draft_only: { t: "Draft only", tone: "warn" }, missing: { t: "Missing", tone: "warn" }, referenced_absent: { t: "Referenced, not in file", tone: "warn" },
};
