import { Clock, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      {/* Decorative cubes */}
      <div className="absolute top-20 right-[15%] w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary to-red-600 animate-float shadow-glow rotate-12" />
      <div className="absolute top-44 right-[8%] w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-secondary animate-float-reverse -rotate-12" />
      <div className="absolute top-36 right-[4%] w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/60 animate-float" style={{ animationDelay: '0.5s' }} />
      
      {/* Decorative gear on right */}
      <div className="absolute right-4 top-1/2 opacity-5 hidden lg:block">
        <Settings className="w-32 h-32 text-muted-foreground" />
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            New Contest Live
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Win Big. <span className="text-gradient">Create Bold.</span>
            <br />Get Rewarded.
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground mb-10 max-w-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Join weekly micro-contests, showcase your creativity, and win amazing prizes from top brands. No design skills required.
          </p>

          {/* Featured Contest Card */}
          <div className="glass-card rounded-2xl p-4 max-w-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                <img 
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&auto=format&fit=crop" 
                  alt="Morning Routine"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">This Week's Contest</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">Live</span>
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">"My Morning Routine"</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Share a photo of your morning ritual. Coffee? Yoga? Chaos? Show us your real mornings!
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 flex-1">
                {[
                  { value: "2", label: "Days" },
                  { value: "14", label: "Hrs" },
                  { value: "32", label: "Min" },
                  { value: "5", label: "Sec" },
                ].map((item, i) => (
                  <div key={item.label} className="text-center">
                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center font-display font-bold text-foreground">
                      {item.value}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="font-medium text-foreground">🏆 $500 Prize</div>
              </div>
              <Link to="/contest/morning-routine">
                <Button className="ml-2">
                  Enter Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Watch How It Works */}
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <ChevronRight className="w-4 h-4" />
            <span className="text-sm">Watch How It Works</span>
          </button>

          {/* Stats */}
          <div className="flex items-center gap-8 md:gap-12 mt-12 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            {[
              { value: "50K+", label: "Active Creators" },
              { value: "$2M+", label: "Prizes Awarded" },
              { value: "500+", label: "Brand Partners" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
