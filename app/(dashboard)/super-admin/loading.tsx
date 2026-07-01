import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-10 w-32 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-9 w-9 rounded-lg bg-gray-100 animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 rounded-md animate-pulse" />
              <div className="h-10 w-full bg-gray-50 rounded-md animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="lg:col-span-2 xl:col-span-2">
          <CardContent className="p-5">
            <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
          </CardContent>
        </Card>
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
