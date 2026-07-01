export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="h-5 w-40 bg-gray-200 rounded-md animate-pulse mb-4" />
            <div className="h-44 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
