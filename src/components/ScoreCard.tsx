import { Star, Sparkles, Heart, TrendingUp } from "lucide-react";

interface ScoreCardProps {
  creativity: number;
  skill: number;
  engagement: number;
  total: number;
  rank?: number;
}

const ScoreCard = ({ creativity, skill, engagement, total, rank }: ScoreCardProps) => {
  const scores = [
    { label: "Creativity", value: creativity, icon: Sparkles, color: "text-primary" },
    { label: "Skill", value: skill, icon: Star, color: "text-accent" },
    { label: "Engagement", value: engagement, icon: Heart, color: "text-destructive" },
  ];

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      {/* Header with rank */}
      {rank && (
        <div className="flex items-center justify-between mb-6">
          <span className="text-muted-foreground text-sm font-medium">Your Score</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold text-sm">Rank #{rank}</span>
          </div>
        </div>
      )}

      {/* Individual scores */}
      <div className="space-y-4 mb-6">
        {scores.map((score, index) => (
          <div key={score.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <score.icon className={`w-4 h-4 ${score.color}`} />
                {score.label}
              </span>
              <span className="font-bold text-foreground">{score.value}/100</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-primary rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${score.value}%`,
                  animationDelay: `${index * 200}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total score */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Total Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display font-bold text-gradient animate-count-up">{total}</span>
            <span className="text-muted-foreground text-sm">/300</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
