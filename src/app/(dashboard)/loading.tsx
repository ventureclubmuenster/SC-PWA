export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="-mx-4 -mt-6 mb-1 noise-panel-accent border-b border-[#E8E8ED] px-5 pt-5 pb-4">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-[#E8E8ED]" />
        <div className="mt-1 h-4 w-48 animate-pulse rounded bg-[#E8E8ED]" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#E8E8ED]" />
        ))}
      </div>
    </div>
  );
}
