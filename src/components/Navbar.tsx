import { useState } from "react";
import { Trophy, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileMenu from "./MobileMenu";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">Contestify</span>
            </Link>

            {/* Center nav - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/contests" className="text-foreground font-medium text-sm hover:text-primary transition-colors">Contests</Link>
              <a href="/#how-it-works" className="text-muted-foreground text-sm hover:text-foreground transition-colors">How It Works</a>
              <Link to="/leaderboard" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Leaderboard</Link>
              <a href="/#brands" className="text-muted-foreground text-sm hover:text-foreground transition-colors">For Brands</a>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
                Log In
              </Button>
              <Button size="sm" className="hidden md:inline-flex">
                Join Free
              </Button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};

export default Navbar;