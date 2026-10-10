import Link from "next/link";
export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-xl rounded-lg border border-rule bg-card p-8 text-center">
      <h1 className="text-xl font-semibold">We can&apos;t find that page</h1>
      <p className="mt-2 text-sm text-muted">The contract or page you opened is not in this prototype&apos;s dataset. It covers 15 drafts and 17 signed contracts.</p>
      <Link href="/" className="mt-5 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">Go to the contract dashboard</Link>
    </div>
  );
}
