import { RefreshCw, Settings } from "lucide-react";
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
    <section id="leaderboard" className="py-20 relative overflow-hidden">
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
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-display font-bold text-gray-900">Weekly Leaderboard</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4" />
                <span>Updated Live</span>
              </div>
            </div>

            {/* Leaders */}
            <div className="divide-y divide-gray-100">
              {leaders.map((leader) => (
                <div 
                  key={leader.rank}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                    leader.rank <= 3 ? "bg-gradient-to-r from-red-50 to-transparent" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    leader.rank === 1 
                      ? "bg-yellow-100 text-yellow-600" 
                      : leader.rank === 2
                      ? "bg-gray-200 text-gray-600"
                      : leader.rank === 3
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {leader.rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200">
                    <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{leader.name}</span>
                      {leader.badge && <span>{leader.badge}</span>}
                    </div>
                    <span className="text-xs text-gray-500">{leader.wins} wins this month</span>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="font-display font-bold text-primary">{leader.points.toLocaleString()}</div>
                    <span className="text-xs text-gray-500">points</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">
                View Full Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gears */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 hidden lg:block">
        <Settings className="w-24 h-24 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Leaderboard;
