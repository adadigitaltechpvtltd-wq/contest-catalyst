import { RefreshCw, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const leaders = [
  { rank: 1, name: "Sarah Chen", wins: 8, badge: "🏆", points: 12450, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
  { rank: 2, name: "Marcus Johnson", wins: 6, badge: "🥈", points: 11200, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
  { rank: 3, name: "Aisha Patel", wins: 5, badge: "🥉", points: 9800, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" },
  { rank: 4, name: "Jake Williams", wins: 5, badge: null, points: 8900, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" },
  { rank: 5, name: "Luna Rodriguez", wins: 4, badge: null, points: 8450, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" },
];

const rankStyles = (rank: number) => {
  if (rank === 1) return "bg-primary/15 text-primary";
  if (rank === 2) return "bg-accent/15 text-accent";
  if (rank === 3) return "bg-secondary text-secondary-foreground";
  return "bg-muted text-muted-foreground";
};

const Leaderboard = () => {
  return (
    <section id="leaderboard" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Top <span className="text-gradient">Creators</span>
          </h2>
          <p className="text-muted-foreground">Meet the legends who consistently bring their A-game</p>
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
              {leaders.map((leader) => (
                <div
                  key={leader.rank}
                  className={
                    "flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors " +
                    (leader.rank <= 3 ? "bg-gradient-to-r from-primary/10 to-transparent" : "")
                  }
                >
                  <div
                    className={
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " +
                      rankStyles(leader.rank)
                    }
                  >
                    {leader.rank}
                  </div>

                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-border">
                    <img
                      src={leader.avatar}
                      alt={`${leader.name} avatar`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{leader.name}</span>
                      {leader.badge && <span>{leader.badge}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{leader.wins} wins this month</span>
                  </div>

                  <div className="text-right">
                    <div className="font-display font-bold text-primary">{leader.points.toLocaleString()}</div>
                    <span className="text-xs text-muted-foreground">points</span>
                  </div>
                </div>
              ))}
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
