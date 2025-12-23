import { Trophy, Gift, PartyPopper, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Winner {
  name: string;
  avatar: string;
  prize: string;
  score: number;
}

interface PrizeAnnouncementProps {
  contestName: string;
  winners: Winner[];
  brand: string;
}

const PrizeAnnouncement = ({ contestName, winners, brand }: PrizeAnnouncementProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-primary-foreground">
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 animate-float">
        <PartyPopper className="w-12 h-12 opacity-30" />
      </div>
      <div className="absolute bottom-4 left-4 animate-float" style={{ animationDelay: '1s' }}>
        <Gift className="w-10 h-10 opacity-20" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-4">
          <Trophy className="w-5 h-5" />
          <span className="font-semibold text-sm">Contest Complete!</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">{contestName}</h2>
        <p className="text-primary-foreground/80">Sponsored by {brand}</p>
      </div>

      {/* Winners podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {/* 2nd place */}
        <div className="flex flex-col items-center">
          <img 
            src={winners[1]?.avatar} 
            alt={winners[1]?.name}
            className="w-14 h-14 rounded-full border-3 border-primary-foreground/50 mb-2"
          />
          <span className="text-sm font-medium mb-1">{winners[1]?.name}</span>
          <div className="w-20 h-24 bg-primary-foreground/20 rounded-t-lg flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-bold">2</span>
            <span className="text-xs opacity-80">{winners[1]?.prize}</span>
          </div>
        </div>

        {/* 1st place */}
        <div className="flex flex-col items-center -mt-4">
          <Crown className="w-8 h-8 text-accent mb-2 animate-pulse-glow" />
          <img 
            src={winners[0]?.avatar} 
            alt={winners[0]?.name}
            className="w-20 h-20 rounded-full border-4 border-accent mb-2 shadow-glow"
          />
          <span className="font-bold mb-1">{winners[0]?.name}</span>
          <div className="w-24 h-32 bg-accent/30 rounded-t-lg flex flex-col items-center justify-center">
            <span className="text-4xl font-display font-bold">1</span>
            <span className="text-sm font-medium">{winners[0]?.prize}</span>
          </div>
        </div>

        {/* 3rd place */}
        <div className="flex flex-col items-center">
          <img 
            src={winners[2]?.avatar} 
            alt={winners[2]?.name}
            className="w-12 h-12 rounded-full border-2 border-primary-foreground/40 mb-2"
          />
          <span className="text-sm font-medium mb-1">{winners[2]?.name}</span>
          <div className="w-18 h-20 bg-primary-foreground/15 rounded-t-lg flex flex-col items-center justify-center px-4">
            <span className="text-xl font-display font-bold">3</span>
            <span className="text-xs opacity-80">{winners[2]?.prize}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button variant="accent" size="lg" className="shadow-card">
          View Full Leaderboard
        </Button>
      </div>
    </div>
  );
};

export default PrizeAnnouncement;
