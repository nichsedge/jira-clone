
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Skeleton */}
      <div className="hidden border-r bg-muted/40 md:block md:w-64">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-4 p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {/* Header Skeleton */}
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Skeleton className="h-10 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex flex-1 flex-col gap-8 p-4 lg:gap-8 lg:p-8">
          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-none bg-background/50 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Board Skeleton */}
          <div className="flex flex-col gap-4">
             <Skeleton className="h-8 w-48" />
             <div className="flex gap-8 overflow-hidden">
                {[1, 2, 3].map((col) => (
                  <div key={col} className="flex flex-col gap-4 w-[320px] flex-shrink-0">
                    <div className="flex items-center justify-between px-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl bg-muted/30 p-3 min-h-[500px] border border-dashed">
                      {[1, 2, 3].map((card) => (
                        <Card key={card} className="p-4">
                          <Skeleton className="h-4 w-full mb-3" />
                          <Skeleton className="h-3 w-2/3 mb-4" />
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
