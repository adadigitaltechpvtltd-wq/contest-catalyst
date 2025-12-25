import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Trophy, Medal, Award, Camera, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wins: number;
  total_submissions: number;
  contests_entered: number;
}

const LeaderboardPage = () => {
  const { data: leaders, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .order("wins", { ascending: false })
        .order("total_submissions", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-300/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30";
      default:
        return "bg-card border-border";
    }
  };

  const listStartIndex = leaders && leaders.length >= 3 ? 3 : 0;
  const listLeaders = leaders?.slice(listStartIndex) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Trophy className="w-4 h-4" />
              Hall of Fame
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Top <span className="text-gradient">Photographers</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the creative geniuses who consistently capture stunning moments and dominate our contests
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Total Winners", value: leaders?.filter(l => l.wins > 0).length || 0, icon: Trophy },
              { label: "Active Photographers", value: leaders?.length || 0, icon: Camera },
              { label: "Total Submissions", value: leaders?.reduce((acc, l) => acc + l.total_submissions, 0) || 0, icon: Users },
              { label: "Contests Participated", value: leaders?.reduce((acc, l) => acc + l.contests_entered, 0) || 0, icon: Award },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="max-w-4xl mx-auto">
            {/* Top 3 Podium */}
            {!isLoading && leaders && leaders.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Second Place */}
                <div className="order-1 md:order-1 pt-8">
                  <div className="bg-card border-2 border-gray-400/30 rounded-2xl p-6 text-center relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden ring-4 ring-gray-400/30 mb-3">
                      {leaders[1].avatar_url ? (
                        <img src={leaders[1].avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">
                          {leaders[1].full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{leaders[1].full_name || "Anonymous"}</h3>
                    <p className="text-xl font-bold text-gray-400">{leaders[1].wins} wins</p>
                    <p className="text-xs text-muted-foreground">{leaders[1].total_submissions} submissions</p>
                  </div>
                </div>

                {/* First Place */}
                <div className="order-2 md:order-2">
                  <div className="bg-gradient-to-b from-yellow-500/20 to-card border-2 border-yellow-500/50 rounded-2xl p-6 text-center relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Trophy className="w-10 h-10 text-yellow-500" />
                    </div>
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-yellow-500/50 mb-3 mt-2">
                      {leaders[0].avatar_url ? (
                        <img src={leaders[0].avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">
                          {leaders[0].full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg text-foreground truncate">{leaders[0].full_name || "Anonymous"}</h3>
                    <p className="text-2xl font-bold text-yellow-500">{leaders[0].wins} wins</p>
                    <p className="text-sm text-muted-foreground">{leaders[0].total_submissions} submissions</p>
                  </div>
                </div>

                {/* Third Place */}
                <div className="order-3 md:order-3 pt-12">
                  <div className="bg-card border-2 border-amber-600/30 rounded-2xl p-6 text-center relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden ring-4 ring-amber-600/30 mb-3">
                      {leaders[2].avatar_url ? (
                        <img src={leaders[2].avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xl">
                          {leaders[2].full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground truncate text-sm">{leaders[2].full_name || "Anonymous"}</h3>
                    <p className="text-lg font-bold text-amber-600">{leaders[2].wins} wins</p>
                    <p className="text-xs text-muted-foreground">{leaders[2].total_submissions} submissions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of the Leaderboard */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display font-bold text-foreground">Full Rankings</h2>
              </div>

              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="w-32 h-4 mb-2" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                      <Skeleton className="w-16 h-6" />
                    </div>
                  ))}
                </div>
              ) : !leaders || leaders.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No photographers ranked yet. Be the first to win a contest!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {listLeaders.map((leader, index) => {
                    const rank = index + 1 + listStartIndex;
                    return (
                      <div
                        key={leader.user_id ?? `${rank}-${leader.full_name ?? "unknown"}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {rank}
                        </div>

                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-border">
                          {leader.avatar_url ? (
                            <img
                              src={leader.avatar_url}
                              alt={leader.full_name ? `${leader.full_name} avatar` : "Photographer avatar"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-lg">
                              {leader.full_name?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {leader.full_name || "Anonymous"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {leader.contests_entered} contests • {leader.total_submissions} submissions
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-primary">{leader.wins}</div>
                          <span className="text-xs text-muted-foreground">wins</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LeaderboardPage;
