import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorState from "@/components/ErrorState";
import LeaderboardSkeleton from "@/components/skeletons/LeaderboardSkeleton";
import { Trophy, Camera, Users, Award } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import LeaderboardTable from "@/components/LeaderboardTable";

const LeaderboardPage = () => {
  const { data: leaders, isLoading, isError, refetch } = useLeaderboard({ limit: 50 });

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

          {isLoading ? (
            <LeaderboardSkeleton />
          ) : isError ? (
            <ErrorState
              title="Failed to Load Leaderboard"
              message="We couldn't load the leaderboard data. Please try again."
              onRetry={() => refetch()}
            />
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {[
                  { label: "Total Winners", value: leaders?.filter((l) => l.wins > 0).length || 0, icon: Trophy },
                  { label: "Active Photographers", value: leaders?.length || 0, icon: Camera },
                  {
                    label: "Total Submissions",
                    value: leaders?.reduce((acc, l) => acc + l.total_submissions, 0) || 0,
                    icon: Users,
                  },
                  {
                    label: "Campaigns Participated",
                    value: leaders?.reduce((acc, l) => acc + l.contests_entered, 0) || 0,
                    icon: Award,
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
                    <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Leaderboard Table */}
              <div className="max-w-4xl mx-auto">
                <LeaderboardTable
                  leaders={leaders}
                  isLoading={false}
                  showViewAll={false}
                  title="Full Rankings"
                />
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LeaderboardPage;
