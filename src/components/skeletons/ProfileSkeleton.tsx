import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const ProfileSkeleton = () => {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Profile Overview Skeleton */}
      <Card className="glass-card lg:col-span-1">
        <CardContent className="p-6 text-center">
          <div className="relative inline-block mb-4">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-40 mx-auto" />

          <Separator className="my-6" />

          <div className="space-y-4 text-left">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings Skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-10 w-28" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-6 w-44 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Separator className="my-4" />
            <Skeleton className="h-4 w-48" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-10 w-36" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
