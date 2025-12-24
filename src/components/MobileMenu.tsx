import { useState, useEffect } from "react";
import { X, Trophy, User, LogOut, Image, Wallet, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navLinks = [
    { label: "Contests", href: "/contests", isLink: true },
    { label: "How It Works", href: "/#how-it-works", isLink: false },
    { label: "Leaderboard", href: "/leaderboard", isLink: true },
    { label: "For Brands", href: "/#brands", isLink: false },
  ];

  const userLinks = [
    { label: "Dashboard", href: "/dashboard", icon: User },
    { label: "My Submissions", href: "/my-submissions", icon: Image },
    { label: "Wallet", href: "/wallet", icon: Wallet },
    { label: "Profile Settings", href: "/profile", icon: Settings },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-card border-l border-border z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Gaal</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* User Info (if logged in) */}
        {user && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{profile?.full_name || 'User'}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navLinks.map((link, i) => (
            link.isLink ? (
              <Link
                key={i}
                to={link.href}
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors font-medium"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={i}
                href={link.href}
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors font-medium"
              >
                {link.label}
              </a>
            )
          ))}
        </nav>

        {/* User Links (if logged in) */}
        {user && (
          <div className="px-4 pb-4 space-y-1 border-t border-border pt-4">
            {userLinks.map((link, i) => (
              <Link
                key={i}
                to={link.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Auth Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-3">
          {user ? (
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          ) : (
            <Link to="/login" onClick={onClose}>
              <Button className="w-full">
                Log in / Join Free
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
