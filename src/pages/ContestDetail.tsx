import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Users, Trophy, CheckCircle, Share2, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubmissionModal from "@/components/SubmissionModal";

// Sample contest data - in a real app this would come from an API
const contestsData: Record<string, {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  prize: string;
  prizeDetails: string[];
  participants: number;
  timeLeft: string;
  endDate: string;
  status: "live" | "soon" | "ended";
  brand: string;
  brandLogo: string;
  image: string;
  rules: string[];
  judgingCriteria: { name: string; weight: number }[];
}> = {
  "morning-routine": {
    id: "morning-routine",
    title: '"My Morning Routine"',
    description: "Share a photo of your morning ritual. Coffee? Yoga? Chaos? Show us your real mornings!",
    fullDescription: "We're looking for authentic, creative photos that capture the essence of your morning routine. Whether you're a sunrise yoga enthusiast, a coffee-first person, or someone who hits snooze five times - we want to see the real you! No professional equipment needed - just your creativity and a smartphone.",
    prize: "$500",
    prizeDetails: ["$500 Cash Prize", "$100 BrewCo Gift Card", "Featured on BrewCo Social Media", "1-Year Supply of Premium Coffee"],
    participants: 247,
    timeLeft: "3d 11h",
    endDate: "December 27, 2024",
    status: "live",
    brand: "BrewCo",
    brandLogo: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=100&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop",
    rules: [
      "One entry per person",
      "Photo must be your own original work",
      "No heavily edited or AI-generated images",
      "Must include a morning-related element",
      "Entries must be submitted before the deadline",
      "Winner will be announced within 48 hours of contest end",
    ],
    judgingCriteria: [
      { name: "Creativity", weight: 40 },
      { name: "Authenticity", weight: 30 },
      { name: "Visual Appeal", weight: 20 },
      { name: "Relevance to Theme", weight: 10 },
    ],
  },
  "pet-of-the-week": {
    id: "pet-of-the-week",
    title: '"Pet of the Week"',
    description: "Show off your furry, feathered, or scaly friend! Most adorable pet wins.",
    fullDescription: "Calling all pet parents! We want to see your adorable companions in their element. Whether your pet is napping, playing, or just being their quirky selves - capture that moment and share it with us. All pets welcome: dogs, cats, birds, fish, reptiles, and everything in between!",
    prize: "$300 + Gift Card",
    prizeDetails: ["$300 Cash Prize", "$150 PetPals Gift Card", "Premium Pet Treats Bundle", "Feature in PetPals Newsletter"],
    participants: 182,
    timeLeft: "5d 8h",
    endDate: "December 29, 2024",
    status: "live",
    brand: "PetPals",
    brandLogo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    rules: [
      "One entry per person",
      "Pet must be your own",
      "Photo must be original and unedited",
      "No harmful or distressing content",
      "All pet types are welcome",
      "Winner announced 24 hours after contest ends",
    ],
    judgingCriteria: [
      { name: "Cuteness Factor", weight: 35 },
      { name: "Photo Quality", weight: 25 },
      { name: "Personality Captured", weight: 25 },
      { name: "Uniqueness", weight: 15 },
    ],
  },
};

const ContestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const contest = id ? contestsData[id] : null;

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Contest Not Found</h1>
          <p className="text-muted-foreground mb-6">The contest you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 h-80 md:h-96">
          <img 
            src={contest.image} 
            alt={contest.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative container mx-auto px-4 pt-8">
          {/* Back button */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Contests
          </Link>

          {/* Contest Info Card */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mt-40 md:mt-52">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                {/* Status Badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    contest.status === "live" 
                      ? "bg-primary text-primary-foreground animate-pulse" 
                      : contest.status === "soon"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {contest.status === "live" ? "🔴 Live Now" : contest.status === "soon" ? "Coming Soon" : "Ended"}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Ends {contest.endDate}
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {contest.title}
                </h1>

                {/* Brand */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <img src={contest.brandLogo} alt={contest.brand} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-muted-foreground">by {contest.brand}</span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  {contest.fullDescription}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{contest.prize}</p>
                      <p className="text-xs text-muted-foreground">Prize</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{contest.participants}</p>
                      <p className="text-xs text-muted-foreground">Entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{contest.timeLeft}</p>
                      <p className="text-xs text-muted-foreground">Time Left</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                {contest.status === "live" && (
                  <Button size="lg" onClick={() => setIsSubmitModalOpen(true)}>
                    Submit Entry
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-primary text-primary" : ""}`} />
                    {isLiked ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Prize Details */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Prize Details
              </h2>
              <ul className="space-y-3">
                {contest.prizeDetails.map((prize, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    {prize}
                  </li>
                ))}
              </ul>
            </div>

            {/* Rules */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                Contest Rules
              </h2>
              <ol className="space-y-3">
                {contest.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Judging Criteria */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                Judging Criteria
              </h2>
              <div className="space-y-4">
                {contest.judgingCriteria.map((criteria, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{criteria.name}</span>
                      <span className="text-muted-foreground">{criteria.weight}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-full"
                        style={{ width: `${criteria.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            {contest.status === "live" && (
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-6 text-center">
                <h3 className="font-display font-bold text-foreground mb-2">
                  Ready to Enter?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Submit your photo and compete for amazing prizes!
                </p>
                <Button className="w-full" onClick={() => setIsSubmitModalOpen(true)}>
                  Submit Your Entry
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {/* Submission Modal */}
      <SubmissionModal 
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        contestTitle={contest.title}
      />
    </div>
  );
};

export default ContestDetail;
