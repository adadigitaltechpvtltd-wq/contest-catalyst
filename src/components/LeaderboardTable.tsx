import { Link } from "react-router-dom";
import { Camera, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";

interface LeaderboardTableProps {
  leaders: LeaderboardEntry[] | undefined;
  isLoading: boolean;
  showViewAll?: boolean;
  maxRows?: number;
  title?: string;
}

const rankStyles = (rank: number) => {
  if (rank === 1) return "bg-primary/15 text-primary";
  if (rank === 2) return "bg-accent/15 text-accent";
  if (rank === 3) return "bg-secondary text-secondary-foreground";
  return "bg-muted text-muted-foreground";
};

const getBadge = (rank: number) => {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

const LeaderboardTable = ({
  leaders,
  isLoading,
  showViewAll = false,
  maxRows,
  title = "Leaderboard",
}: LeaderboardTableProps) => {
  const displayedLeaders = maxRows ? leaders?.slice(0, maxRows) : leaders;

  const getUserProfileUrl = (leader: LeaderboardEntry) => {
    return leader.username ? `/user/${leader.username}` : `/user/${leader.user_id}`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="font-display font-bold text-foreground">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          <span>Updated Live</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <div className="col-span-1">#</div>
        <div className="col-span-3 md:col-span-2">Name</div>
        <div className="col-span-2 text-center hidden md:block">Contests</div>
        <div className="col-span-2 text-center hidden md:block">Submissions</div>
        <div className="col-span-2 text-center hidden md:block">Wins</div>
        <div className="col-span-3 md:col-span-2 text-right">Points</div>
        <div className="col-span-5 md:col-span-1 text-right hidden sm:block"></div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
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
      ) : !displayedLeaders || displayedLeaders.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No leaderboard data available yet. Start competing to see your name here!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {displayedLeaders.map((leader, index) => {
            const rank = index + 1;
            const badge = getBadge(rank);
            const profileUrl = getUserProfileUrl(leader);

            return (
              <div
                key={leader.user_id}
                className={
                  "grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-muted/20 transition-colors " +
                  (rank <= 3 ? "bg-gradient-to-r from-primary/5 to-transparent" : "")
                }
              >
                {/* Rank */}
                <div className="col-span-1">
                  <div
                    className={
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " +
                      rankStyles(rank)
                    }
                  >
                    {rank}
                  </div>
                </div>

                {/* Name & Avatar */}
                <div className="col-span-3 md:col-span-2 flex items-center gap-2 min-w-0">
                  <Link
                    to={profileUrl}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-border bg-muted flex-shrink-0 hover:ring-primary transition-all"
                  >
                    {leader.avatar_url ? (
                      <img
                        src={leader.avatar_url}
                        alt={`${leader.full_name || "User"} avatar`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        {(leader.full_name || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <Link
                        to={profileUrl}
                        className="font-medium text-foreground truncate hover:text-primary transition-colors text-sm"
                      >
                        {leader.full_name || "Anonymous"}
                      </Link>
                      {badge && <span className="text-sm">{badge}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground md:hidden">
                      {leader.wins} wins
                    </span>
                  </div>
                </div>

                {/* Contests */}
                <div className="col-span-2 text-center hidden md:block">
                  <span className="text-foreground">{leader.contests_entered}</span>
                </div>

                {/* Submissions */}
                <div className="col-span-2 text-center hidden md:block">
                  <span className="text-foreground">{leader.total_submissions}</span>
                </div>

                {/* Wins */}
                <div className="col-span-2 text-center hidden md:block">
                  <span className="text-foreground font-medium">{leader.wins}</span>
                </div>

                {/* Points */}
                <div className="col-span-3 md:col-span-2 text-right">
                  <div className="font-display font-bold text-primary text-sm md:text-base">
                    {leader.total_points.toLocaleString()}
                  </div>
                  <span className="text-xs text-muted-foreground">points</span>
                </div>

                {/* View Profile Button */}
                <div className="col-span-5 md:col-span-1 text-right hidden sm:flex justify-end">
                  <Link to={profileUrl}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Button */}
      {showViewAll && (
        <div className="px-6 py-4 border-t border-border">
          <Link to="/leaderboard">
            <Button variant="outline" className="w-full">
              View Full Leaderboard
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;