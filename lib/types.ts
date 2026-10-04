export type Severity = "High" | "Medium" | "Low" | "None";
export type FindingType =
  | "conflict" | "possible_conflict" | "clause_risk" | "entity_law"
  | "bundle" | "consistency" | "data_class" | "fairness";

export interface Quoted { file: string; quote: string }
export interface RegisterRef extends Quoted { entry_id: string; clause_ref: string }
export interface ExceptionRecord { contract: string; label: "deliberate" | "waved_through" | "unlabelled"; note: string }

export interface Finding {
  id: string;
  severity: "High" | "Medium";
  type: FindingType;
  title: string;
  clause_ref: string;
  file: string;
  quote: string;
  explanation: string;
  rule: string;
  register_refs?: RegisterRef[];
  extra_quotes?: (Quoted & { note?: string; clause_ref?: string })[];
  exception_history?: ExceptionRecord[];
  decision_needed?: boolean;
  redact_in_seller_view?: boolean;
  seller_text?: string;
}

export interface ExposureLine extends Quoted {
  label: string; clause_ref: string; calculation: string; result: string; cap: string; redact_in_seller_view?: boolean;
}
export interface BundleItem extends Quoted {
  document: string; status: "signed" | "draft_only" | "missing" | "referenced_absent"; note: string;
}
export interface DataClass extends Quoted { class: string; basis: string; question: string | null }
export interface Passed extends Quoted { rule: string; note: string }
export interface NotChecked { item: string; reason: string }
export interface LowItem extends Quoted { title: string; clause_ref: string; note: string }

export interface Brief {
  slug: string;
  draft_file: string;
  tracker_id: string;
  counterparty: string;
  doc_type: string;
  atliq_entity_in_draft: string;
  client_country: string;
  tracker_status: string;
  deadline: string | null;
  value: string;
  headline: string;
  highest_severity: Severity;
  exposure: ExposureLine[];
  findings: Finding[];
  bundle: { needed: BundleItem[] };
  data_class: DataClass;
  checks_passed: Passed[];
  not_checked: NotChecked[];
  low: LowItem[];
  seller_view: { flag_types: string[]; missing_documents: string[]; ask_karandeep: string[] };
  provenance: string;
}

export interface RegisterEntry {
  id: string; contract: string; counterparty: string; file: string; atliq_entity: string;
  clause_ref: string; type: string; summary: string; quote: string;
  start_date: string | null; end_date: string | null; dates_note: string | null;
  binds_affiliates: string; affiliates_note: string | null;
  waivers: { file: string; clause_ref: string; quote: string; limit: string }[];
  exception_label: string | null; exception_note: string | null;
}
export interface Register {
  meta: { coverage: string; built_from: string; note: string; generated: string };
  entries: RegisterEntry[];
  not_checked: { item?: string; reason?: string; [k: string]: unknown }[];
  absent_terms: unknown[];
}

export type Role = "reviewer" | "seller";
