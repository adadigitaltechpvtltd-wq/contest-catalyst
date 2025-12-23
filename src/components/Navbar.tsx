import { Trophy, User, Bell, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Contesta</span>
          </div>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-foreground font-medium hover:text-primary transition-colors">Contests</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Leaderboard</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Prizes</a>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Streak indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">7</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* User */}
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <User className="w-4 h-4" />
              Sign In
            </Button>
            <Button variant="default" size="sm">
              Join Free
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
