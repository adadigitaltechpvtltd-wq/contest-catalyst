import { Trophy, Medal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const leaders = [
  { rank: 1, name: "Sarah Chen", wins: 8, badge: "🏆", points: 12490, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
  { rank: 2, name: "Marcus Johnson", wins: 6, badge: "🥈", points: 11200, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
  { rank: 3, name: "Aisha Patel", wins: 5, badge: "🥉", points: 9800, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" },
  { rank: 4, name: "Jake Williams", wins: 5, badge: null, points: 8900, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" },
  { rank: 5, name: "Luna Rodriguez", wins: 4, badge: null, points: 8450, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" },
];

const Leaderboard = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Top <span className="text-gradient">Creators</span>
          </h2>
          <p className="text-muted-foreground">
            Meet the legends who consistently bring their A-game
          </p>
        </div>

        {/* Leaderboard Card */}
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
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors ${
                    leader.rank <= 3 ? "bg-gradient-to-r from-primary/5 to-transparent" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    leader.rank === 1 
                      ? "bg-yellow-500/20 text-yellow-500" 
                      : leader.rank === 2
                      ? "bg-gray-400/20 text-gray-400"
                      : leader.rank === 3
                      ? "bg-orange-600/20 text-orange-500"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {leader.rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-border">
                    <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{leader.name}</span>
                      {leader.badge && <span>{leader.badge}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{leader.wins} wins this month</span>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="font-display font-bold text-primary">{leader.points.toLocaleString()}</div>
                    <span className="text-xs text-muted-foreground">points</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border">
              <Button variant="outline" className="w-full">
                View Full Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gears */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 hidden lg:block">
        <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
        </svg>
      </div>
    </section>
  );
};

export default Leaderboard;