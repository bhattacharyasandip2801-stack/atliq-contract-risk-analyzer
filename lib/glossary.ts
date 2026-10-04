// Short plain-English definitions of common contract terms.
// GENERAL INFORMATION: these are NOT taken from AtliQ's 40 files and are NOT legal advice.
// The screen labels them as such and keeps them apart from the quoted passages.
export interface Term { term: string; meaning: string; why: string; search: string }

export const GLOSSARY_NOTE = "General information written for this prototype. It is not from AtliQ's files and it is not legal advice. Meanings vary by contract and by country, so counsel decides what a clause does.";

export const GLOSSARY: Term[] = [
  { term: "Indemnity", meaning: "A promise to cover the other side's losses if a named thing goes wrong, such as a third-party claim.", why: "Check who gives it, for what, and whether it has a limit.", search: "indemnity indemnify" },
  { term: "Liquidated damages (LDs)", meaning: "A sum fixed in advance that one side pays for a specific failure, usually lateness.", why: "Check the rate, the period (per day or per week) and whether there is a cap.", search: "liquidated damages" },
  { term: "Limitation of liability", meaning: "A ceiling on how much one side can be made to pay if things go wrong.", why: "A draft with no ceiling, or a ceiling only for one side, deserves a closer look.", search: "limitation of liability cap" },
  { term: "Uncapped liability", meaning: "No ceiling at all on what one side can owe.", why: "Exposure can exceed the contract value.", search: "unlimited liability uncapped" },
  { term: "Most-favoured customer (MFN)", meaning: "A promise that the customer gets prices or terms at least as good as any other customer.", why: "It can limit what you can offer other clients later.", search: "most favoured customer" },
  { term: "Non-compete", meaning: "A promise not to work in a stated field, with stated customers or in a stated place.", why: "It can block future deals, so check scope, place and length.", search: "non-compete" },
  { term: "Exclusivity", meaning: "A promise to deal only with one party in a field or area.", why: "It can rule out other clients or partners in that area.", search: "exclusive exclusivity" },
  { term: "Governing law and venue", meaning: "Which country's or state's law applies and where disputes are heard.", why: "It decides where a dispute is fought and under which rules.", search: "governing law jurisdiction" },
  { term: "Termination for convenience", meaning: "The right to end the contract without giving a reason, usually after a notice period.", why: "Check who holds the right and how much notice is needed.", search: "termination for convenience notice" },
  { term: "Force majeure", meaning: "Events outside anyone's control, such as natural disasters, that excuse a delay or failure.", why: "Check what counts and whether payment duties are excused.", search: "force majeure" },
  { term: "Intellectual property (IP) assignment vs licence", meaning: "An assignment transfers ownership of the work; a licence only lets someone use it.", why: "Assigning work you may reuse can take it away from you.", search: "intellectual property assignment licence" },
  { term: "NDA", meaning: "A non-disclosure agreement: a promise to keep shared information confidential.", why: "Check whether it is one-way or mutual and how long it lasts.", search: "confidential information mutual" },
  { term: "Business Associate Agreement (BAA)", meaning: "A US contract that sets how a supplier may handle patient health information for a healthcare client.", why: "It is normally needed before any such data is shared.", search: "business associate agreement" },
  { term: "PHI", meaning: "Protected health information: patient data that can identify a person.", why: "It triggers stricter handling rules and usually a BAA.", search: "protected health information PHI" },
  { term: "Statement of Work (SOW)", meaning: "A document under a master agreement that describes one project: scope, dates, fees.", why: "It can add terms, so read it with its master agreement.", search: "statement of work" },
  { term: "Warranty", meaning: "A promise that the work or product will meet stated standards.", why: "Check how long it lasts and what remedy the other side gets.", search: "warranty warrants" },
  { term: "Auto-renewal", meaning: "The contract continues for another term unless someone gives notice in time.", why: "Missing the notice window can lock you in again.", search: "renew renewal term" },
];
