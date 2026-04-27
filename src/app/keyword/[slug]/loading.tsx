import { Skeleton } from "@/components/skeleton";
import { LoadingIndicator } from "@/components/loading-indicator";

export default function KeywordLoading() {
  return (
    <main className="min-h-screen bg-[#1A1A1A] pb-32">
      <LoadingIndicator />
      <header className="pt-32 pb-16 px-6 md:px-16 max-w-4xl mx-auto border-b border-white/10">
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-16 w-1/2 mb-4" />
        <Skeleton className="h-5 w-2/3" />
      </header>

      <div className="max-w-4xl mx-auto px-6 md:px-16 mt-16">
        <Skeleton className="h-4 w-40 mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-8 border border-white/5 bg-white/[0.02]">
              <Skeleton className="h-3 w-12 mb-4" />
              <Skeleton className="h-6 w-full mb-3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
