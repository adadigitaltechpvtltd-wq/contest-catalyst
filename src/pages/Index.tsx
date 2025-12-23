import { UserPlus, Camera, Award, Share2, Trophy, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ContestCard from "@/components/ContestCard";
import UserFlowStep from "@/components/UserFlowStep";
import ScoreCard from "@/components/ScoreCard";
import PrizeAnnouncement from "@/components/PrizeAnnouncement";
import SocialShare from "@/components/SocialShare";

const Index = () => {
  const contests = [
    {
      theme: "Morning Coffee Moments",
      brand: "BrewMaster",
      prize: "$500 Gift Card",
      timeLeft: "2d 14h",
      participants: 1247,
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop",
      featured: true,
    },
    {
      theme: "Pet Selfie Challenge",
      brand: "PetCo",
      prize: "$250 Store Credit",
      timeLeft: "5d 8h",
      participants: 892,
      image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop",
    },
    {
      theme: "Sunset Chasers",
      brand: "TravelNow",
      prize: "Weekend Getaway",
      timeLeft: "3d 22h",
      participants: 2103,
      image: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=600&auto=format&fit=crop",
    },
    {
      theme: "Home Cooking Heroes",
      brand: "KitchenPro",
      prize: "$300 Appliance",
      timeLeft: "6d 4h",
      participants: 634,
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop",
    },
  ];

  const flowSteps = [
    {
      icon: UserPlus,
      title: "Sign Up Free",
      description: "Create your account in seconds. No design skills needed - just bring your creativity!",
    },
    {
      icon: Camera,
      title: "Submit Entry",
      description: "Take a photo, record a video, or write a short answer matching the weekly theme.",
    },
    {
      icon: Star,
      title: "Get Scored",
      description: "Our judges rate your creativity, skill, and community engagement for a total score.",
    },
    {
      icon: Award,
      title: "Win Prizes",
      description: "Top scorers win amazing prizes from our brand sponsors. New contests every week!",
    },
  ];

  const winners = [
    { name: "Sarah M.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", prize: "$500", score: 287 },
    { name: "Mike R.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", prize: "$250", score: 271 },
    { name: "Emma L.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", prize: "$100", score: 264 },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-slide-up">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">New contests every week</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Win Prizes with Your{" "}
            <span className="text-gradient">Creativity</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Join weekly micro-contests, share photos & videos, and win amazing prizes from top brands. No design skills required!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl">
              <Trophy className="w-5 h-5" />
              Start Competing
            </Button>
            <Button variant="outline" size="lg">
              See How It Works
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 py-8 mb-12">
          {[
            { value: "50K+", label: "Active Users" },
            { value: "$2M+", label: "Prizes Awarded" },
            { value: "500+", label: "Contests Run" },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center animate-slide-up" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Contests */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Active Contests
          </h2>
          <Button variant="ghost" className="text-primary">
            View All →
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest, i) => (
            <ContestCard key={i} {...contest} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From sign-up to winning - here's your journey to becoming a contest champion
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flowSteps.map((step, i) => (
              <UserFlowStep 
                key={i} 
                step={i + 1} 
                {...step} 
                isActive={i === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Scoring & Social Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Scoring Example */}
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Judging & Scoring
            </h2>
            <p className="text-muted-foreground mb-6">
              Every entry is scored across three dimensions for a fair, transparent competition.
            </p>
            <ScoreCard 
              creativity={87}
              skill={72}
              engagement={65}
              total={224}
              rank={12}
            />
          </div>

          {/* Social Sharing */}
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Boost Your Score
            </h2>
            <p className="text-muted-foreground mb-6">
              Share your entries and engage with the community to earn bonus points!
            </p>
            <SocialShare 
              contestName="Morning Coffee Moments"
              shares={34}
              likes={156}
              comments={23}
            />
          </div>
        </div>
      </section>

      {/* Prize Announcement Example */}
      <section className="container mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Recent Winners
          </h2>
          <p className="text-muted-foreground">
            Celebrating our latest contest champions
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <PrizeAnnouncement 
            contestName="Cozy Reading Nook"
            winners={winners}
            brand="BookWorm Inc."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-secondary p-8 md:p-12 text-center">
          <div className="relative z-10">
            <h2 className="font-display text-2xl md:text-4xl font-bold text-secondary-foreground mb-4">
              Ready to Start Winning?
            </h2>
            <p className="text-secondary-foreground/80 mb-8 max-w-lg mx-auto">
              Join thousands of creators competing for amazing prizes every week. Your next win is just a photo away!
            </p>
            <Button variant="hero" size="xl">
              <Trophy className="w-5 h-5" />
              Join Free Today
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Contesta</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Contesta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
