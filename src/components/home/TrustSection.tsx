import { Users, Globe, Shield } from "lucide-react";

const trustPoints = [
  {
    icon: Users,
    title: "Growing Community",
    description: "Active creator and participant community",
  },
  {
    icon: Globe,
    title: "Diverse Campaigns",
    description: "Campaigns across tech, lifestyle, education, and food",
  },
  {
    icon: Shield,
    title: "Human-Curated",
    description: "Human-curated, rights-safe content",
  },
];

const TrustSection = () => {
  return (
    <section className="py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {trustPoints.map((point, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <point.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
