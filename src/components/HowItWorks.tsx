import { UserPlus, Camera, Star, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const participantSteps = [
  {
    title: "Join for free",
    description: "Create your profile in seconds. No credit card required.",
  },
  {
    title: "Enter live campaigns",
    description: "Browse and join campaigns that match your interests.",
  },
  {
    title: "Share real moments",
    description: "Submit authentic content showcasing your experience.",
  },
  {
    title: "Earn rewards",
    description: "Get cash, products, vouchers, and brand recognition.",
  },
];

const brandSteps = [
  {
    title: "Define campaign goals",
    description: "Tell us what you want to achieve with your campaign.",
  },
  {
    title: "Gaal manages end-to-end",
    description: "We handle everything from launch to moderation.",
  },
  {
    title: "Users participate at scale",
    description: "Real people engage with your brand authentically.",
  },
  {
    title: "Receive outcomes",
    description: "Get content, reach, insights, and marketing assets.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(0 0% 6%) 0%, hsl(0 0% 3%) 100%)' }}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Gaal <span className="text-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Simple process for both participants and brands
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* For Participants */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">For Participants</h3>
            </div>
            <div className="space-y-4">
              {participantSteps.map((step, i) => (
                <div 
                  key={i}
                  className="relative bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300"
                >
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="ml-2">
                    <h4 className="font-display font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/contests">
                <Button className="group">
                  Browse Campaigns
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* For Brands */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">For Brands</h3>
            </div>
            <div className="space-y-4">
              {brandSteps.map((step, i) => (
                <div 
                  key={i}
                  className="relative bg-card border border-border rounded-xl p-5 hover:border-orange-500/50 transition-all duration-300"
                >
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="ml-2">
                    <h4 className="font-display font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/for-brands">
                <Button variant="outline" className="group border-orange-500/50 text-orange-500 hover:bg-orange-500/10">
                  Launch a Campaign
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
