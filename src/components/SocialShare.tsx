import { Share2, Twitter, Instagram, Copy, Check, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SocialShareProps {
  campaignName: string;
  shares: number;
  likes: number;
  comments: number;
}

const SocialShare = ({ campaignName, shares, likes, comments }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-primary" />
        Share & Engage
      </h3>

      {/* Engagement stats */}
      <div className="flex items-center justify-around py-4 mb-4 bg-muted rounded-xl">
        <button 
          onClick={handleLike}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            liked ? 'scale-110' : 'hover:scale-105'
          }`}
        >
          <Heart 
            className={`w-6 h-6 transition-colors ${
              liked ? 'text-destructive fill-destructive' : 'text-muted-foreground'
            }`} 
          />
          <span className="text-sm font-semibold text-foreground">{likes + (liked ? 1 : 0)}</span>
          <span className="text-xs text-muted-foreground">Likes</span>
        </button>
        
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{comments}</span>
          <span className="text-xs text-muted-foreground">Comments</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <Repeat2 className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{shares}</span>
          <span className="text-xs text-muted-foreground">Shares</span>
        </div>
      </div>

      {/* Share buttons */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Boost your score by sharing your entry!
        </p>
        
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" size="sm" className="flex-col h-auto py-3 gap-1.5">
            <Twitter className="w-5 h-5" />
            <span className="text-xs">Twitter</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-col h-auto py-3 gap-1.5">
            <Instagram className="w-5 h-5" />
            <span className="text-xs">Instagram</span>
          </Button>
          <Button 
            variant={copied ? "success" : "outline"} 
            size="sm" 
            className="flex-col h-auto py-3 gap-1.5"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span className="text-xs">{copied ? "Copied!" : "Copy Link"}</span>
          </Button>
        </div>

        <div className="mt-4 p-3 bg-accent/20 rounded-xl">
          <p className="text-xs text-accent-foreground font-medium text-center">
            🎁 +10 bonus points for each share that gets 5+ likes!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialShare;
