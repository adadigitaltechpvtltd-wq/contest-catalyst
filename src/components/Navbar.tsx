import { useState } from "react";
import { Trophy, Menu, User, LogOut, Settings, Image, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import MobileMenu from "./MobileMenu";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
              {user ? (
                <>
                  <Link to="/dashboard" className="hidden md:block">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {profile?.full_name && (
                            <p className="font-medium">{profile.full_name}</p>
                          )}
                          {user.email && (
                            <p className="w-[200px] truncate text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/my-submissions" className="cursor-pointer">
                          <Image className="mr-2 h-4 w-4" />
                          My Submissions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/wallet" className="cursor-pointer">
                          <Wallet className="mr-2 h-4 w-4" />
                          Wallet
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Profile Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="sm" className="hidden md:inline-flex">
                      Join Free
                    </Button>
                  </Link>
                </>
              )}
              
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