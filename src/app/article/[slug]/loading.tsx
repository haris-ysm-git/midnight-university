import { Skeleton } from "@/components/skeleton";
import { LoadingIndicator } from "@/components/loading-indicator";

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-32">
      <LoadingIndicator />
      <header className="pt-32 pb-16 px-6 md:px-16 max-w-4xl mx-auto border-b border-white/10">
        <Skeleton className="h-4 w-24 mb-8" />
        <Skeleton className="h-16 w-full mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-16 mt-16 space-y-8">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <div className="pt-12 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    </div>
  );
}
