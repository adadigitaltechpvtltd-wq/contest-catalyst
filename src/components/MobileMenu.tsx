import { useState, useEffect } from "react";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
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

  const navLinks = [
    { label: "Contests", href: "/#contests" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Leaderboard", href: "/#leaderboard" },
    { label: "For Brands", href: "/#brands" },
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
            <span className="font-display font-bold text-lg text-foreground">Contestify</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navLinks.map((link, i) => (
            <a
              key={i}
              href={link.href}
              onClick={onClose}
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-3">
          <Button variant="outline" className="w-full">
            Log In
          </Button>
          <Button className="w-full">
            Join Free
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
