export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
