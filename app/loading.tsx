export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="h-7 w-56 rounded bg-rule" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-rule" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-lg border border-rule bg-card" />)}</div>
      <div className="mt-6 h-64 rounded-lg border border-rule bg-card" />
    </div>
  );
}
