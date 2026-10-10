import type { Metadata } from "next";
import { getRole } from "@/lib/role";
import { KB_STATS, library } from "@/lib/knowledge";
import KnowledgeSearch from "@/components/KnowledgeSearch";
import { AuditOnMount } from "@/components/Small";

export const metadata: Metadata = { title: "Knowledge base" };
export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  if ((await getRole()) === "seller") return <p className="card rounded-lg border border-rule bg-card p-6 text-muted">The knowledge base holds other clients&apos; contract text, so it is hidden in the seller view. Ask Karandeep.</p>;
  return (
    <div>
      <AuditOnMount action="view knowledge base" target="knowledge base" />
      <h1 className="text-2xl font-bold">Knowledge base</h1>
      <p className="mt-2 max-w-3xl text-muted">Everything AtliQ has written down about contracts, in one searchable place. Ask in plain words, read the exact passage and open the full document beside it.</p>
      <div className="mt-5"><KnowledgeSearch stats={KB_STATS()} library={library()} /></div>
    </div>
  );
}
