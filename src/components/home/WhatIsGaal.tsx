import { XCircle } from "lucide-react";

const WhatIsGaal = () => {
  const antiFeatures = [
    "No AI content.",
    "No fake engagement.",
    "No influencer noise.",
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            What is <span className="text-gradient">Gaal</span>?
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Gaal helps brands run <strong className="text-foreground">large-scale participation campaigns</strong> powered by real users.
          </p>
          
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Instead of relying on ads, influencers, or stock visuals, brands engage real people to <strong className="text-foreground">use, experience, and share authentic content</strong> — creating trust and visibility that feels natural.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {antiFeatures.map((feature, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsGaal;
