export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </article>
  );
}
