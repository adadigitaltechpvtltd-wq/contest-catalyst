import { Play, Settings, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const countdown = [
  { value: "2", label: "Days" },
  { value: "14", label: "Hours" },
  { value: "32", label: "Mins" },
  { value: "5", label: "Secs" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Background atmosphere */}
      <div className="absolute inset-0 hero-atmosphere" aria-hidden />

      {/* Decorative cubes */}
      <div
        className="absolute top-24 right-[12%] w-24 h-24 md:w-32 md:h-32 rounded-[28px] bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--warm-pink))] animate-float shadow-glow rotate-12"
        aria-hidden
      />
      <div
        className="absolute top-44 right-[7%] w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-secondary/80 animate-float-reverse -rotate-12"
        aria-hidden
      />
      <div
        className="absolute bottom-16 left-[10%] w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--cool-blue)/0.9)] to-[hsl(var(--cool-purple)/0.85)] animate-float shadow-glow -rotate-12"
        style={{ animationDelay: "0.7s" }}
        aria-hidden
      />

      {/* Decorative gear */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.06] hidden lg:block" aria-hidden>
        <Settings className="w-28 h-28 text-foreground" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="flex justify-center mb-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/25 text-primary text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              New Contest Live
            </div>
          </div>

          {/* Tagline */}
          <p className="font-display text-lg md:text-xl font-medium text-muted-foreground tracking-wide mb-4">
            Real moments. Real value.
          </p>

          {/* Headline */}
          <h1 className="font-display text-[44px] leading-[1.02] md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
            <span className="text-foreground">Create Bold.</span>{" "}
            <span className="text-gradient">Compete Fair.</span>
            <br />
            <span className="text-gradient-cool">Get Rewarded.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 mx-auto max-w-3xl text-lg md:text-xl text-muted-foreground">
            <span className="font-semibold text-foreground">Gaal — Where everyday photos earn.</span> A skill-based photo contest platform where creators compete in short challenges and earn cash, products, and brand recognition — all for free.
          </p>

          {/* Featured Contest Card */}
          <div className="mt-12 mx-auto max-w-4xl glass-card rounded-3xl">
            <div className="p-6 md:p-8">
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/90 to-emerald-600/70 flex items-center justify-center text-xl border border-border/20">
                    🌱
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">This Week's Challenge</div>
                    <div className="font-display text-2xl font-bold text-foreground">"My Morning Routine"</div>
                  </div>
                </div>
                <span className="px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm font-semibold">
                  Live
                </span>
              </div>

              <p className="mt-4 text-left text-muted-foreground">
                Coffee or chaos, calm or rush — show us what your mornings really look like.
              </p>

              {/* Countdown row */}
              <div className="mt-6 rounded-2xl bg-muted/30 border border-border/50 px-6 py-5">
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-4">
                  {countdown.map((c, idx) => (
                    <div key={c.label} className="contents">
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-foreground">{c.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                      </div>
                      {idx < countdown.length - 1 && (
                        <div className="text-muted-foreground/70 text-3xl font-display">:</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom row */}
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>1,247 entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>Up to $500 in rewards</span>
                  </div>
                </div>

                <Link to="/contest/morning-routine">
                  <Button size="lg" className="rounded-2xl px-10">
                    Enter Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Watch How It Works */}
          <div className="mt-10 flex justify-center">
            <a href="/#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl border-border/60 bg-card/20 hover:bg-card/35 text-foreground"
              >
                <Play className="w-4 h-4" />
                Watch How It Works
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-primary">50K+</div>
              <div className="text-xs text-muted-foreground">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-[hsl(var(--cool-blue))]">$2M+</div>
              <div className="text-xs text-muted-foreground">Prizes Awarded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-foreground">500+</div>
              <div className="text-xs text-muted-foreground">Brand Partners</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
