import { Skeleton } from "@/components/skeleton";
import { LoadingIndicator } from "@/components/loading-indicator";

export default function RandomLoading() {
  return (
    <main className="min-h-screen bg-[#1A1A1A] flex flex-col">
      <LoadingIndicator />
      <header className="px-10 py-6 border-b border-white/5 flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-12" />
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full px-6 md:px-0 space-y-10">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
          <div className="space-y-2 pt-10">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>
    </main>
  );
}
