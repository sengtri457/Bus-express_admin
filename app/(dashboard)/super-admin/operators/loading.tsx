import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded-md animate-pulse" />
          <div className="mt-1 h-4 w-48 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
                </div>
                <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-28 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100">
            <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded-md animate-pulse" />
                </div>
                <div className="h-4 w-28 bg-gray-100 rounded-md animate-pulse" />
                <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded-md animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
