import { Skeleton } from "@/components/ui/skeleton";

const CampaignDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 pt-8">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-32 mb-8" />

      {/* Contest Info Card Skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mt-40 md:mt-52">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            {/* Status and date */}
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>

            {/* Title */}
            <Skeleton className="h-10 w-3/4 mb-2" />

            {/* Theme */}
            <Skeleton className="h-5 w-48 mb-2" />

            {/* Description */}
            <Skeleton className="h-5 w-full mb-1" />
            <Skeleton className="h-5 w-4/5 mb-6" />

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailSkeleton;
