import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LeaderboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Stats Summary Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
            <Skeleton className="w-6 h-6 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        ))}
      </div>

      {/* Leaderboard Table Skeleton */}
      <Card className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-border bg-secondary/30">
          <div className="col-span-1">
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="col-span-4 md:col-span-3">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="col-span-2 hidden md:block">
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
          <div className="col-span-2 hidden md:block">
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
          <div className="col-span-5 md:col-span-2">
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-6 py-4 items-center">
              <div className="col-span-1">
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
              <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="col-span-2 hidden md:block">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
              <div className="col-span-2 hidden md:block">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
              <div className="col-span-5 md:col-span-2">
                <Skeleton className="h-5 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LeaderboardSkeleton;
