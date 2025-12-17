import { Skeleton } from '@/components/ui/skeleton';

export function StorySkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Skeleton */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <Skeleton className="w-full h-full bg-muted/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content Skeleton */}
      <main className="relative z-10 -mt-32 md:-mt-48 px-4 md:px-0">
        <article className="max-w-3xl mx-auto">
          {/* Back Link Skeleton */}
          <Skeleton className="h-5 w-32 mb-6 bg-muted/30" />

          {/* Title Skeleton */}
          <Skeleton className="h-12 md:h-16 w-3/4 mb-4 bg-muted/30" />

          {/* Meta Skeleton */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Skeleton className="h-6 w-20 rounded-full bg-muted/30" />
            <Skeleton className="h-5 w-16 bg-muted/30" />
            <Skeleton className="h-5 w-24 bg-muted/30" />
            <Skeleton className="h-5 w-28 bg-muted/30" />
          </div>

          {/* Tags Skeleton */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Skeleton className="h-6 w-16 rounded bg-muted/30" />
            <Skeleton className="h-6 w-20 rounded bg-muted/30" />
            <Skeleton className="h-6 w-14 rounded bg-muted/30" />
            <Skeleton className="h-6 w-18 rounded bg-muted/30" />
          </div>

          {/* Synopsis Skeleton */}
          <div className="border-l-4 border-muted pl-4 mb-8">
            <Skeleton className="h-5 w-full mb-2 bg-muted/30" />
            <Skeleton className="h-5 w-5/6 bg-muted/30" />
          </div>

          {/* Button Skeleton */}
          <Skeleton className="h-10 w-28 rounded-lg mb-8 bg-muted/30" />

          {/* Story Content Skeleton */}
          <div className="space-y-4">
            {/* Paragraph skeletons */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-full bg-muted/30" />
                <Skeleton className="h-5 w-full bg-muted/30" />
                <Skeleton className="h-5 w-11/12 bg-muted/30" />
                <Skeleton className="h-5 w-4/5 bg-muted/30" />
                <div className="h-4" /> {/* Paragraph spacing */}
              </div>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
