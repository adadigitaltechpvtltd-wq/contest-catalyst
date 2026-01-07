import { Clock, Users, Trophy, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignCardProps {
  theme: string;
  brand?: string;
  prize: string;
  prizeAmount?: number;
  timeLeft: string;
  participants: number;
  image: string;
  coverImage?: string | null;
  featured?: boolean;
}

const CampaignCard = ({ theme, brand, prize, prizeAmount, timeLeft, participants, image, coverImage, featured }: CampaignCardProps) => {
  const isFreeCampaign = prizeAmount === 0;
  const displayImage = coverImage || image;
  
  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-500 hover:shadow-glow hover:scale-[1.02] ${
        featured ? 'col-span-full lg:col-span-2 lg:row-span-2' : ''
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'h-64 lg:h-80' : 'h-48'}`}>
        <img 
          src={displayImage} 
          alt={theme}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        
        {/* Brand badge - only show if brand exists */}
        {brand && (
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm text-xs font-semibold text-foreground">
            {brand}
          </div>
        )}
        
        {/* Free campaign badge */}
        {isFreeCampaign && (
          <div className={`absolute ${brand ? 'top-14' : 'top-4'} left-4 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg`}>
            🎉 FREE
          </div>
        )}
        
        {/* Time badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {timeLeft}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className={`font-display font-bold text-foreground mb-2 ${featured ? 'text-2xl' : 'text-lg'}`}>
          {theme}
        </h3>
        
        <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-accent" />
            {prize}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {participants} joined
          </span>
        </div>

        <Button variant={featured ? "hero" : "default"} size={featured ? "lg" : "default"} className="w-full">
          <Camera className="w-4 h-4" />
          Enter Campaign
        </Button>
      </div>

      {/* Featured glow effect */}
      {featured && (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      )}
    </div>
  );
};

export default CampaignCard;
