export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-10 w-40 bg-gray-100 rounded-lg animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
