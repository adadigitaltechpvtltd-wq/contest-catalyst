import { Check, TrendingUp, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Check,
    title: "Authentic UGC",
    description: "Real content from real people who genuinely engage with your brand.",
  },
  {
    icon: Share2,
    title: "High Participation",
    description: "Contest entries get shared, liked, and talked about organically.",
  },
  {
    icon: Users,
    title: "Targeted Reach",
    description: "Connect with engaged audiences who match your demographic.",
  },
];

const brandIcons = [
  { icon: "🎵", bg: "bg-purple-500/20" },
  { icon: "📷", bg: "bg-pink-500/20" },
  { icon: "🎮", bg: "bg-blue-500/20" },
  { icon: "👟", bg: "bg-green-500/20" },
  { icon: "☕", bg: "bg-orange-500/20" },
  { icon: "🎨", bg: "bg-cyan-500/20" },
];

const BrandsSection = () => {
  return (
    <section id="brands" className="py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for <span className="text-gradient">Brands</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg">
              Launch creative campaigns that generate genuine user-generated content and meaningful engagement. Authentic UGC that feels human.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-8">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg">
              Partner With Us
            </Button>
          </div>

          {/* Right Card */}
          <div className="relative">
            <div className="bg-card border border-border rounded-2xl p-6 overflow-hidden relative">
              {/* Gradient accent in corner */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-primary/30 via-orange-500/20 to-transparent rounded-full blur-3xl" />
              
              <div className="relative">
                <p className="text-sm text-muted-foreground mb-6">Trusted by hundreds of brands across lifestyle, tech, food, and fashion</p>
                
                {/* Brand icons grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {brandIcons.map((brand, i) => (
                    <div 
                      key={i}
                      className={`w-16 h-16 rounded-xl ${brand.bg} flex items-center justify-center text-2xl`}
                    >
                      {brand.icon}
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-xs text-muted-foreground">Average ROI</span>
                    </div>
                    <div className="font-display text-2xl font-bold text-foreground">$4.5x</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Engagement Rate</span>
                    </div>
                    <div className="font-display text-2xl font-bold text-foreground">8.2x higher</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;