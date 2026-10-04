// Topic tiles for the knowledge base landing view. Each tile only runs a search over the dataset files,
// so what it shows always comes from them. The short labels are navigation, not content.
export interface Topic { title: string; hint: string; query: string }
export const TOPICS: Topic[] = [
  { title: "Liability and indemnity", hint: "Caps, unlimited liability, who covers whose losses", query: "limitation of liability indemnity unlimited" },
  { title: "Payment and fees", hint: "Payment terms, invoices, late payment", query: "payment terms invoice days" },
  { title: "Delay damages and penalties", hint: "Liquidated damages, delay rates, caps", query: "liquidated damages delay per day" },
  { title: "IP and ownership", hint: "Who owns the work, licences, reuse", query: "intellectual property ownership licence" },
  { title: "Data, PHI and privacy", hint: "Patient data, BAAs, data handling", query: "protected health information data business associate" },
  { title: "Non-compete and exclusivity", hint: "Promises not to serve others, past consents", query: "non-compete exclusive" },
  { title: "Most-favoured pricing", hint: "Pricing promises to earlier clients", query: "MFN" },
  { title: "Termination and renewal", hint: "Notice periods, ending early, auto-renewal", query: "termination notice renewal" },
  { title: "Law, courts and entities", hint: "Governing law, which AtliQ entity signs", query: "governing law entity jurisdiction" },
  { title: "Confidentiality and NDAs", hint: "One-way or mutual, how long it lasts", query: "confidential information mutual term" },
  { title: "Exceptions and time pressure", hint: "Things waved through, waivers, lessons", query: "waiver letter exception waived" },
  { title: "Who approves what", hint: "Karandeep's rules, sign-off, escalation", query: "who signs approval Karandeep checklist" },
];
