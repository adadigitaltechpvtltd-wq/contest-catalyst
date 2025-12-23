import { Clock, DollarSign, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Contest {
  id: string;
  title: string;
  description: string;
  prize: string;
  participants: number;
  timeLeft: string;
  status: "live" | "soon" | "ended";
  brand: string;
  image: string;
  gradient: string;
}

const contests: Contest[] = [
  {
    id: "morning-routine",
    title: '"My Morning Routine"',
    description: "Share a photo of your morning ritual. Coffee? Yoga? Chaos? Show us your real mornings!",
    prize: "$500",
    participants: 247,
    timeLeft: "3d 11h",
    status: "live",
    brand: "BrewCo",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    id: "pet-of-the-week",
    title: '"Pet of the Week"',
    description: "Show off your furry, feathered, or scaly friend! Most adorable pet wins.",
    prize: "$300 + Gift Card",
    participants: 182,
    timeLeft: "5d 8h",
    status: "live",
    brand: "PetPals",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&auto=format&fit=crop",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: "summer-vibes",
    title: '"Summer Vibes"',
    description: "Capture your best summer moment. Beach, BBQ, or backyard - we want to see it!",
    prize: "$750 + Merchandise",
    participants: 412,
    timeLeft: "Starts Jul 1",
    status: "soon",
    brand: "SunStyle Fashion",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop",
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  {
    id: "desk-setup-goals",
    title: '"Desk Setup Goals"',
    description: "Show us your workspace. Clean or cluttered, we love seeing where the magic happens.",
    prize: "$1000 + tech bundle",
    participants: 2341,
    timeLeft: "Ended",
    status: "ended",
    brand: "TechZone",
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&auto=format&fit=crop",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
];

const ActiveContests = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Active <span className="text-gradient">Contests</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Jump into any contest that sparks your creativity. New challenges added every week.
          </p>
        </div>

        {/* Contest Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {contests.map((contest, i) => (
            <div 
              key={i}
              className={`group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 ${
                contest.status === "ended" ? "opacity-75" : ""
              }`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${contest.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden">
                      <img src={contest.image} alt={contest.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{contest.brand}</span>
                      <h3 className="font-display font-bold text-foreground">{contest.title}</h3>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    contest.status === "live" 
                      ? "bg-primary text-primary-foreground" 
                      : contest.status === "soon"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {contest.status === "live" ? "Live" : contest.status === "soon" ? "Soon" : "Ended"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {contest.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="text-primary">🏆</span>
                    {contest.prize}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {contest.participants}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {contest.timeLeft}
                  </span>
                </div>

                {/* Action */}
                {contest.status === "live" ? (
                  <Link to={`/contest/${contest.id}`}>
                    <Button className="w-full">
                      Enter Contest <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                ) : contest.status === "soon" ? (
                  <Button variant="outline" className="w-full">
                    Notify Me <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="ghost" className="w-full">
                    View Winners <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center">
          <Button variant="outline" size="lg">
            View All Contests
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActiveContests;