import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const opacity = Math.min(progress + 0.3, 1);

  return (
    <div
      className="flex items-center justify-center transition-all duration-200"
      style={{
        height: isRefreshing ? 60 : pullDistance,
        opacity,
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <ArrowDown
            className="h-6 w-6 text-primary transition-transform duration-200"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          />
        )}
        <span className="text-xs text-muted-foreground">
          {isRefreshing
            ? "Refreshing..."
            : progress >= 1
            ? "Release to refresh"
            : "Pull to refresh"}
        </span>
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
