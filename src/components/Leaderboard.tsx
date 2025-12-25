import { Settings } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import LeaderboardTable from "@/components/LeaderboardTable";

const Leaderboard = () => {
  const { data: leaders, isLoading } = useLeaderboard({ limit: 5 });

  return (
    <section id="leaderboard" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Top <span className="text-gradient">Creators</span>
          </h2>
          <p className="text-muted-foreground">
            Creators compete in skill-based tiers to keep competitions fair for everyone
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <LeaderboardTable
            leaders={leaders}
            isLoading={isLoading}
            showViewAll={true}
            title="Weekly Leaderboard"
          />
        </div>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06] hidden lg:block" aria-hidden>
        <Settings className="w-24 h-24 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Leaderboard;
