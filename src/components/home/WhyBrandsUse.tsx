import { Rocket, MessageCircle, Users, DollarSign, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const useCases = [
  { icon: Rocket, text: "Launch new products" },
  { icon: MessageCircle, text: "Collect real user content and feedback" },
  { icon: Users, text: "Reach relevant audiences authentically" },
  { icon: DollarSign, text: "Reduce ad fatigue and creative costs" },
];

const outcomes = [
  "High-volume real creatives",
  "Organic distribution through participants",
  "Assets ready for ads, websites, marketplaces, and remarketing",
];

const WhyBrandsUse = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Brands Use <span className="text-gradient">Gaal</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Large-Scale, User-Driven Marketing
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Use Cases */}
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Brands use Gaal to:
              </h3>
              <div className="space-y-4">
                {useCases.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes */}
            <div className="bg-gradient-to-br from-primary/10 via-orange-500/5 to-background rounded-2xl p-8 border border-border">
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                One campaign delivers:
              </h3>
              <ul className="space-y-4 mb-8">
                {outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-foreground">{outcome}</span>
                  </li>
                ))}
              </ul>
              <Link to="/for-brands">
                <Button size="lg" className="w-full sm:w-auto">
                  Launch a Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyBrandsUse;
