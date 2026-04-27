import { Skeleton } from "@/components/skeleton";
import { LoadingIndicator } from "@/components/loading-indicator";

export default function HomeLoading() {
  return (
    <main className="min-h-screen flex flex-col bg-[#1A1A1A]">
      <LoadingIndicator />
      <div className="hidden md:flex flex-col flex-1">
        {/* Hero Skeleton */}
        <div className="pt-40 pb-20 px-16 max-w-7xl">
          <Skeleton className="h-20 w-3/4 mb-6" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        
        {/* Grid Skeleton */}
        <div className="px-16 pb-32 grid grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      <div className="md:hidden p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
