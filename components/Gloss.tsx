// Wraps short contract abbreviations in a hover explanation so the reader does not have to leave the page.
// General information, not legal advice; the full list is on the Knowledge base page.
const TERMS: Record<string, string> = {
  LD: "Liquidated damages: a sum fixed in advance for a specific failure, usually lateness.",
  LDs: "Liquidated damages: a sum fixed in advance for a specific failure, usually lateness.",
  MFN: "Most-favoured customer: the customer gets terms at least as good as any other customer.",
  PHI: "Protected health information: patient data that can identify a person.",
  BAA: "Business Associate Agreement: the US contract that sets how patient data may be handled.",
  GCC: "Gulf Cooperation Council states, such as Saudi Arabia, the UAE and Oman.",
  NDA: "Non-disclosure agreement: a promise to keep shared information confidential.",
  SOW: "Statement of Work: a document under a master agreement that describes one project.",
};
const RE = new RegExp(`\\b(${Object.keys(TERMS).sort((a, b) => b.length - a.length).join("|")})\\b`, "g");

export default function Gloss({ text }: { text: string }) {
  const parts = text.split(RE);
  return <>{parts.map((p, i) => (i % 2 === 1 ? <abbr key={i} title={TERMS[p]} className="cursor-help underline decoration-dotted underline-offset-2">{p}</abbr> : p))}</>;
}
