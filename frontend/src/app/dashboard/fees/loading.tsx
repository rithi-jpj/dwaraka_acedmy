export default function FeesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="h-4 w-64 bg-slate-100 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-12 bg-slate-100 rounded-xl" />
      <div className="h-10 bg-slate-100 rounded-lg" />
      <div className="h-96 bg-slate-100 rounded-2xl" />
    </div>
  );
}
