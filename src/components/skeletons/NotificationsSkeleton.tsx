import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const NotificationsSkeleton = () => {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="glass-card">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationsSkeleton;
