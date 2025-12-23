import { Check, TrendingUp, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Check,
    title: "Authentic UGC",
    description: "Get real content from real people who love your brand.",
  },
  {
    icon: Share2,
    title: "Viral Potential",
    description: "Contest entries get shared, liked, and talked about.",
  },
  {
    icon: Users,
    title: "Targeted Reach",
    description: "Connect with engaged audiences who match your demographic.",
  },
];

const brandLogos = [
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1572021335469-31706a17ber?w=80&auto=format&fit=crop",
];

const BrandsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-card/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Brands <span className="text-gradient">Love Us</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg">
              Partner with Contestify to launch engaging campaigns that generate authentic user-generated content and build lasting customer relationships.
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
            <div className="bg-card border border-border rounded-2xl p-6 overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
              
              <div className="relative">
                <p className="text-sm text-muted-foreground mb-4">Trusted by 500+ brands worldwide</p>
                
                {/* Brand logos grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {brandLogos.map((logo, i) => (
                    <div 
                      key={i}
                      className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
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