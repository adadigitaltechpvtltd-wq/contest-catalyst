import { Gift, Camera, Briefcase, Users } from "lucide-react";

const reasons = [
  {
    icon: Users,
    text: "Join real participation campaigns",
  },
  {
    icon: Camera,
    text: "Share everyday moments, routines, setups, or experiences",
  },
  {
    icon: Gift,
    text: "Earn cash, products, vouchers, and recognition",
  },
  {
    icon: Briefcase,
    text: "Build a public portfolio and get discovered by brands",
  },
];

const WhyPeopleJoin = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why People Join <span className="text-gradient">Gaal</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Create. Participate. Get Rewarded.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <reason.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-foreground font-medium">{reason.text}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">
              No experience required. <strong className="text-foreground">Just real participation.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyPeopleJoin;
