"use client";
import { useMemo, useSyncExternalStore } from "react";
// Decision log and audit log live in the browser's localStorage (PRD: no database in the prototype).
export interface Decision { key: string; slug: string; findingId: string; choice: "accept" | "negotiate" | "reject" | "override"; reason: string; person: string; at: string; role: string; title: string }
export interface AuditRow { at: string; role: string; action: string; target: string; detail?: string }

const DK = "atliq.decisions.v1", AK = "atliq.audit.v1";
function read<T>(k: string): T[] { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T[]) : []; } catch { return []; } }
function write<T>(k: string, v: T[]) { try { localStorage.setItem(k, JSON.stringify(v)); window.dispatchEvent(new Event("atliq-store")); } catch { /* storage unavailable */ } }

export const getDecisions = () => read<Decision>(DK);
export function saveDecision(d: Omit<Decision, "at">) {
  const all = getDecisions().filter((x) => x.key !== d.key);
  all.push({ ...d, at: new Date().toISOString() });
  write(DK, all);
  logAudit(d.role, "decision", d.key, `${d.choice}${d.reason ? ": " + d.reason : ""}`);
}
export function clearDecision(key: string, role: string) { write(DK, getDecisions().filter((x) => x.key !== key)); logAudit(role, "decision cleared", key); }
export const getAudit = () => read<AuditRow>(AK);
export function logAudit(role: string, action: string, target: string, detail?: string) {
  const all = getAudit(); all.push({ at: new Date().toISOString(), role, action, target, detail }); write(AK, all.slice(-500));
}

// Review timer (PRD target: Karandeep decides in under 5 minutes). One record per brief per browser.
export interface Review { slug: string; start: string; end?: string; seconds?: number; spent?: number }
const RK = "atliq.reviews.v1";
export const getReviews = () => read<Review>(RK);
/** Starts the clock when the reviewer presses Start timer. Does nothing if a record already exists. */
export function startReview(slug: string) { const all = getReviews(); if (!all.some((r) => r.slug === slug)) write(RK, [...all, { slug, start: new Date().toISOString(), spent: 0 }]); }
/** Saves the seconds spent so far on this brief. The clock counts only while the brief is open and visible. */
export function saveSpent(slug: string, spent: number) {
  const all = getReviews(), r = all.find((x) => x.slug === slug);
  if (!r || r.end || r.spent === spent) return;
  r.spent = spent; write(RK, all);
}
/** Stops the clock once every High finding has a recorded decision. */
export function finishReview(slug: string, spent: number) {
  const all = getReviews(), r = all.find((x) => x.slug === slug);
  if (!r || r.end) return;
  r.end = new Date().toISOString(); r.spent = spent; r.seconds = Math.max(1, spent);
  write(RK, all);
}
export function resetReview(slug: string) { write(RK, getReviews().filter((r) => r.slug !== slug)); }
export function clearAll() { write(DK, []); write(AK, []); write(RK, []); }

function subscribe(cb: () => void) {
  window.addEventListener("atliq-store", cb); window.addEventListener("storage", cb);
  return () => { window.removeEventListener("atliq-store", cb); window.removeEventListener("storage", cb); };
}
const snap = (k: string) => () => { try { return localStorage.getItem(k) ?? "[]"; } catch { return "[]"; } };
function useList<T>(k: string): T[] {
  const raw = useSyncExternalStore(subscribe, snap(k), () => "[]");
  return useMemo(() => { try { return JSON.parse(raw) as T[]; } catch { return []; } }, [raw]);
}
export const useDecisions = () => useList<Decision>(DK);
export const useAudit = () => useList<AuditRow>(AK);
export const useReviews = () => useList<Review>(RK);
