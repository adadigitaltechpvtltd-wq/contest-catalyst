import { UserPlus, Camera, Star, Trophy, Settings } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your profile in seconds. No credit card, no commitment, just creativity.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Camera,
    title: "Submit Your Entry",
    description: "Upload your photo, video, or creative answer. Show off you are — authenticity wins!",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Star,
    title: "Get Scored",
    description: "Contestify uses a judge-mix AI. Creativity, originality, and engagement matters.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description: "Top scorers win cash, products, and exclusive brand partnerships.",
    color: "from-yellow-500 to-orange-500",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(0 0% 6%) 0%, hsl(0 0% 3%) 100%)' }}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground">
            From sign-up to winning – it's simpler than you think
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div 
              key={i}
              className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-display font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {/* Decorative gear */}
              <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative gear on right side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 hidden lg:block">
        <Settings className="w-32 h-32 text-muted-foreground" />
      </div>
    </section>
  );
};

export default HowItWorks;
