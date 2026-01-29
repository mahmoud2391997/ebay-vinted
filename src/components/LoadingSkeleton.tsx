import { Card } from '@/components/ui/card';

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="glass-panel p-4">
          <div className="flex gap-4">
            {/* Image skeleton */}
            <div className="w-32 h-32 rounded-lg bg-muted animate-shimmer" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-muted rounded animate-shimmer w-3/4" />
              <div className="h-4 bg-muted rounded animate-shimmer w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-muted rounded animate-shimmer" />
                <div className="h-6 w-24 bg-muted rounded animate-shimmer" />
              </div>
              <div className="h-4 bg-muted rounded animate-shimmer w-1/3" />
            </div>

            {/* Price skeleton */}
            <div className="flex flex-col items-end gap-2">
              <div className="h-8 w-24 bg-muted rounded animate-shimmer" />
              <div className="h-4 w-20 bg-muted rounded animate-shimmer" />
              <div className="h-9 w-28 bg-muted rounded animate-shimmer mt-auto" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
