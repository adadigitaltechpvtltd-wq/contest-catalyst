import { useEffect, useState } from "react";
import { Play, Settings, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedContest {
  id: string;
  title: string;
  description: string | null;
  prize_amount: number;
  prize_currency: string;
  end_date: string;
  theme: string | null;
}

const HeroSection = () => {
  const [contest, setContest] = useState<FeaturedContest | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const fetchFeaturedContest = async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("id, title, description, prize_amount, prize_currency, end_date, theme")
        .eq("featured_in_hero", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setContest(data);
        // Fetch participant count
        const { count } = await supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .eq("contest_id", data.id);
        setParticipantCount(count ?? 0);
      }
      setLoading(false);
    };

    fetchFeaturedContest();
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!contest?.end_date) return;

    const updateCountdown = () => {
      const endTime = new Date(contest.end_date).getTime();
      const now = Date.now();
      const diff = Math.max(0, endTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, mins, secs });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [contest?.end_date]);

  const formatPrize = (amount: number, currency: string) => {
    if (currency === "INR") return `₹${amount.toLocaleString()}`;
    if (currency === "USD") return `$${amount.toLocaleString()}`;
    return `${amount.toLocaleString()} ${currency}`;
  };

  const countdownItems = [
    { value: countdown.days.toString(), label: "Days" },
    { value: countdown.hours.toString(), label: "Hours" },
    { value: countdown.mins.toString(), label: "Mins" },
    { value: countdown.secs.toString(), label: "Secs" },
  ];

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
              {contest ? "Contest Live" : "New Contest Coming"}
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
          {loading ? (
            <div className="mt-12 mx-auto max-w-4xl glass-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <div className="text-left">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-7 w-48" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-5 w-full max-w-md" />
              <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
              <div className="mt-6 flex items-center justify-between">
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-12 w-32 rounded-2xl" />
              </div>
            </div>
          ) : contest ? (
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
                      <div className="font-display text-2xl font-bold text-foreground">"{contest.title}"</div>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm font-semibold">
                    Live
                  </span>
                </div>

                <p className="mt-4 text-left text-muted-foreground">
                  {contest.description || contest.theme || "Join this exciting photography challenge!"}
                </p>

                {/* Countdown row */}
                <div className="mt-6 rounded-2xl bg-muted/30 border border-border/50 px-6 py-5">
                  <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-4">
                    {countdownItems.map((c, idx) => (
                      <div key={c.label} className="contents">
                        <div className="text-center">
                          <div className="text-3xl font-display font-bold text-foreground">{c.value}</div>
                          <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                        </div>
                        {idx < countdownItems.length - 1 && (
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
                      <span>{participantCount.toLocaleString()} entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>Up to {formatPrize(contest.prize_amount, contest.prize_currency)} in rewards</span>
                    </div>
                  </div>

                  <Link to={`/contest/${contest.id}`}>
                    <Button size="lg" className="rounded-2xl px-10">
                      Enter Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-12 mx-auto max-w-4xl glass-card rounded-3xl p-8 text-center">
              <p className="text-muted-foreground text-lg">No featured contest at the moment. Check back soon!</p>
              <Link to="/contests" className="mt-4 inline-block">
                <Button variant="outline" size="lg">Browse All Contests</Button>
              </Link>
            </div>
          )}

          {/* Watch How It Works */}
          <div className="mt-10 flex justify-center">
            <Link to="/#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl border-border/60 bg-card/20 hover:bg-card/35 text-foreground"
              >
                <Play className="w-4 h-4" />
                Watch How It Works
              </Button>
            </Link>
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
