import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Contestify</span>
          </div>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground font-medium text-sm hover:text-primary transition-colors">Contests</a>
            <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">How It Works</a>
            <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Leaderboard</a>
            <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">For Brands</a>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Log In
            </Button>
            <Button size="sm">
              Join Free
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;