import { useEffect, useState } from "react";
import { RefreshCw, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  wins: number;
  total_submissions: number;
  contests_entered: number;
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

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from("leaderboard_stats")
          .select("user_id, full_name, avatar_url, wins, total_submissions, contests_entered")
          .order("wins", { ascending: false })
          .order("total_submissions", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching leaderboard:", error);
          setLoading(false);
          return;
        }

        if (data) {
          // Show users who have at least participated (have submissions or contests entered)
          const activeUsers = data.filter(
            (user) => (user.total_submissions ?? 0) > 0 || (user.contests_entered ?? 0) > 0
          );
          setLeaders(activeUsers as LeaderboardEntry[]);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Calculate points based on wins and submissions
  const calculatePoints = (leader: LeaderboardEntry) => {
    return (leader.wins * 1000) + (leader.total_submissions * 50) + (leader.contests_entered * 100);
  };

  return (
    <section id="leaderboard" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Top <span className="text-gradient">Creators</span>
          </h2>
          <p className="text-muted-foreground">Creators compete in skill-based tiers to keep competitions fair for everyone</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-bold text-foreground">Weekly Leaderboard</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
                <span>Updated Live</span>
              </div>
            </div>

            {/* Leaders */}
            <div className="divide-y divide-border">
              {loading ? (
                // Skeleton loading state
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-5 w-16 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))
              ) : leaders.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  No leaderboard data available yet. Start competing to see your name here!
                </div>
              ) : (
                leaders.map((leader, index) => {
                  const rank = index + 1;
                  const badge = getBadge(rank);
                  const points = calculatePoints(leader);

                  return (
                    <div
                      key={leader.user_id}
                      className={
                        "flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors " +
                        (rank <= 3 ? "bg-gradient-to-r from-primary/10 to-transparent" : "")
                      }
                    >
                      <div
                        className={
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " +
                          rankStyles(rank)
                        }
                      >
                        {rank}
                      </div>

                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-border bg-muted">
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
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {leader.full_name || "Anonymous Creator"}
                          </span>
                          {badge && <span>{badge}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{leader.wins} wins this month</span>
                      </div>

                      <div className="text-right">
                        <div className="font-display font-bold text-primary">{points.toLocaleString()}</div>
                        <span className="text-xs text-muted-foreground">points</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 border-t border-border">
              <Link to="/leaderboard">
                <Button variant="outline" className="w-full">
                  View Full Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06] hidden lg:block" aria-hidden>
        <Settings className="w-24 h-24 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Leaderboard;
