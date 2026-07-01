export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-60 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-10 w-36 bg-gray-100 rounded-lg animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
