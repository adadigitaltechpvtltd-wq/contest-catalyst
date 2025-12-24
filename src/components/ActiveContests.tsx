import { Clock, Users, ArrowRight } from "lucide-react";
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
  topBorder: string;
}

const contests: Contest[] = [
  {
    id: "morning-routine",
    title: '"My Morning Routine"',
    description: "Coffee or chaos, calm or rush — show us what your mornings really look like.",
    prize: "Up to $500",
    participants: 247,
    timeLeft: "3d 11h",
    status: "live",
    brand: "BrewCo",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop",
    topBorder: "from-orange-500 via-red-500 to-pink-500",
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
    topBorder: "from-purple-500 via-pink-500 to-red-500",
  },
  {
    id: "summer-vibes",
    title: '"Summer Vibes"',
    description: "Capture your best summer moment. Beach, BBQ, or backyard — we want to see it!",
    prize: "$750 + Merchandise",
    participants: 412,
    timeLeft: "Starts Jul 1",
    status: "soon",
    brand: "SunStyle Fashion",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop",
    topBorder: "from-yellow-500 via-orange-500 to-red-500",
  },
  {
    id: "desk-setup-goals",
    title: '"Desk Setup Goals"',
    description: "Show us your workspace. Clean or cluttered, we love seeing where the magic happens.",
    prize: "$1,000 + Tech Bundle",
    participants: 2341,
    timeLeft: "Ended",
    status: "ended",
    brand: "TechZone",
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&auto=format&fit=crop",
    topBorder: "from-blue-500 via-cyan-500 to-teal-500",
  },
];

const ActiveContests = () => {
  return (
    <section id="contests" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Active <span className="text-gradient">Contests</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover challenges that spark your creativity. New contests launch every week.
          </p>
        </div>

        {/* Contest Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {contests.map((contest, i) => (
            <div 
              key={i}
              className={`group relative overflow-hidden rounded-2xl bg-card transition-all duration-300 ${
                contest.status === "ended" ? "opacity-60" : ""
              }`}
            >
              {/* Gradient top border */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${contest.topBorder}`} />
              
              <div className="relative p-5 pt-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-border">
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
                      ? "bg-amber-500 text-black"
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
                  <Button variant="ghost" className="w-full text-muted-foreground">
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
