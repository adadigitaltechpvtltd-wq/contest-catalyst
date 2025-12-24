import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Users, Trophy, CheckCircle, Share2, Heart, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubmissionModal from "@/components/SubmissionModal";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";

interface Contest {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  prize_amount: number;
  prize_currency: string;
  start_date: string;
  end_date: string;
  voting_end_date: string | null;
  status: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';
  cover_image_url: string | null;
  rules: string[] | null;
  judging_criteria: string[] | null;
  min_participants: number;
  max_participants: number | null;
}

const ContestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const fetchContest = async () => {
      if (!id) return;

      setIsLoading(true);
      
      // Fetch contest
      const { data: contestData, error: contestError } = await supabase
        .from("contests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (contestError) {
        console.error("Error fetching contest:", contestError);
        setIsLoading(false);
        return;
      }

      setContest(contestData);

      // Fetch participant count
      if (contestData) {
        const { count } = await supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .eq("contest_id", id);
        
        setParticipantCount(count || 0);
      }

      setIsLoading(false);
    };

    fetchContest();
  }, [id]);

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    
    if (end < now) return "Ended";
    
    return formatDistanceToNow(end, { addSuffix: false }) + " left";
  };

  const getStatusDisplay = (status: Contest['status']) => {
    switch (status) {
      case 'active':
        return { label: "🔴 Live Now", className: "bg-primary text-primary-foreground animate-pulse" };
      case 'voting':
        return { label: "🗳️ Voting", className: "bg-accent text-accent-foreground" };
      case 'completed':
        return { label: "Ended", className: "bg-muted text-muted-foreground" };
      case 'draft':
        return { label: "Coming Soon", className: "bg-muted text-muted-foreground" };
      default:
        return { label: status, className: "bg-muted text-muted-foreground" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Contest Not Found</h1>
          <p className="text-muted-foreground mb-6">The contest you're looking for doesn't exist.</p>
          <Link to="/contests">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(contest.status);
  const defaultImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop";
  const prizeFormatted = `${contest.prize_currency} ${contest.prize_amount.toLocaleString()}`;

  // Default judging criteria if none provided
  const judgingCriteria = contest.judging_criteria?.length 
    ? contest.judging_criteria.map((criteria, i) => ({
        name: criteria,
        weight: Math.round(100 / (contest.judging_criteria?.length || 1))
      }))
    : [
        { name: "Creativity", weight: 40 },
        { name: "Authenticity", weight: 30 },
        { name: "Visual Appeal", weight: 20 },
        { name: "Relevance to Theme", weight: 10 },
      ];

  // Default rules if none provided
  const rules = contest.rules?.length 
    ? contest.rules 
    : [
        "One entry per person",
        "Photo must be your own original work",
        "No heavily edited or AI-generated images",
        "Entries must be submitted before the deadline",
      ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 h-80 md:h-96">
          <img 
            src={contest.cover_image_url || defaultImage} 
            alt={contest.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative container mx-auto px-4 pt-8">
          {/* Back button */}
          <Link to="/contests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Contests
          </Link>

          {/* Contest Info Card */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mt-40 md:mt-52">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                {/* Status Badge */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                    {statusDisplay.label}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Ends {format(new Date(contest.end_date), "MMMM d, yyyy")}
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {contest.title}
                </h1>

                {/* Theme */}
                {contest.theme && (
                  <p className="text-muted-foreground mb-2">Theme: {contest.theme}</p>
                )}

                {/* Description */}
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  {contest.description || "Share your best photos and compete for amazing prizes!"}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{prizeFormatted}</p>
                      <p className="text-xs text-muted-foreground">Prize</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{participantCount}</p>
                      <p className="text-xs text-muted-foreground">Entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{formatTimeLeft(contest.end_date)}</p>
                      <p className="text-xs text-muted-foreground">Time Left</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                {contest.status === "active" && (
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
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  {prizeFormatted} Cash Prize
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  Featured on GAAL Platform
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  Winner Badge on Profile
                </li>
              </ul>
            </div>

            {/* Rules */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                Contest Rules
              </h2>
              <ol className="space-y-3">
                {rules.map((rule, i) => (
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
                {judgingCriteria.map((criteria, i) => (
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
            {contest.status === "active" && (
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
