import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Users, Trophy, CheckCircle, Share2, Calendar, Loader2, Eye, Image as ImageIcon, User, Instagram, Twitter, Linkedin, Copy, Check } from "lucide-react";
import ContestDetailSkeleton from "@/components/skeletons/ContestDetailSkeleton";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubmissionModal from "@/components/SubmissionModal";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

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

interface Submission {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const ContestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [userSubmission, setUserSubmission] = useState<{ id: string; title: string } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedImage, setSelectedImage] = useState<Submission | null>(null);
  const [hasMoreSubmissions, setHasMoreSubmissions] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalApproved, setTotalApproved] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = contest ? `Check out "${contest.title}" contest on GAAL!` : "Check out this contest on GAAL!";

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    
    let shareLink = "";
    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "instagram":
        // Instagram doesn't have direct web share, copy link instead
        handleCopyLink();
        toast.info("Link copied! Share it on Instagram");
        return;
    }
    window.open(shareLink, "_blank", "noopener,noreferrer");
    setIsShareDialogOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const SUBMISSIONS_PER_PAGE = 12;

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
      toast.error("Failed to load contest details. Please try again.");
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

        // Check if current user has submitted and if contest is saved
        if (user) {
          const { data: submission } = await supabase
            .from("submissions")
            .select("id, title")
            .eq("contest_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (submission) {
            setUserSubmission(submission);
          }
        }

        // Get total count of approved submissions
        const { count: approvedCount } = await supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .eq("contest_id", id)
          .in("status", ["approved", "winner"]);

        setTotalApproved(approvedCount || 0);

        // Fetch approved submissions for gallery
        const { data: approvedSubmissions } = await supabase
          .from("submissions")
          .select(`
            id,
            title,
            image_url,
            user_id,
            status,
            created_at,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .eq("contest_id", id)
          .in("status", ["approved", "winner"])
          .order("created_at", { ascending: false })
          .limit(SUBMISSIONS_PER_PAGE);

        if (approvedSubmissions) {
          setSubmissions(approvedSubmissions as unknown as Submission[]);
          setHasMoreSubmissions((approvedCount || 0) > SUBMISSIONS_PER_PAGE);
        }
      }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchContest();
  }, [id, user]);

  const loadMoreSubmissions = async () => {
    if (!id || isLoadingMore) return;

    setIsLoadingMore(true);

    const { data: moreSubmissions } = await supabase
      .from("submissions")
      .select(`
        id,
        title,
        image_url,
        user_id,
        status,
        created_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq("contest_id", id)
      .in("status", ["approved", "winner"])
      .order("created_at", { ascending: false })
      .range(submissions.length, submissions.length + SUBMISSIONS_PER_PAGE - 1);

    if (moreSubmissions) {
      const newSubmissions = [...submissions, ...(moreSubmissions as unknown as Submission[])];
      setSubmissions(newSubmissions);
      setHasMoreSubmissions(newSubmissions.length < totalApproved);
    }

    setIsLoadingMore(false);
  };

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
        <div className="relative">
          <div className="absolute inset-0 h-80 md:h-96 bg-muted animate-pulse" />
          <ContestDetailSkeleton />
        </div>
        <Footer />
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
                {userSubmission ? (
                  <Link to="/submissions">
                    <Button size="lg" variant="secondary" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View My Submission
                    </Button>
                  </Link>
                ) : contest.status === "active" ? (
                  <Link to={`/submit/${contest.id}`}>
                    <Button size="lg" className="w-full">
                      Submit Entry
                    </Button>
                  </Link>
                ) : null}
                <Button variant="outline" size="icon" onClick={() => setIsShareDialogOpen(true)}>
                  <Share2 className="w-4 h-4" />
                </Button>

                {/* Share Dialog */}
                <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share this contest</DialogTitle>
                      <DialogDescription>
                        Share "{contest?.title}" with your friends
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-3 py-4">
                      <Button 
                        variant="outline" 
                        className="flex-col h-auto py-4 gap-2"
                        onClick={() => handleShare("twitter")}
                      >
                        <Twitter className="w-5 h-5" />
                        <span className="text-xs">Twitter</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-col h-auto py-4 gap-2"
                        onClick={() => handleShare("instagram")}
                      >
                        <Instagram className="w-5 h-5" />
                        <span className="text-xs">Instagram</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-col h-auto py-4 gap-2"
                        onClick={() => handleShare("linkedin")}
                      >
                        <Linkedin className="w-5 h-5" />
                        <span className="text-xs">LinkedIn</span>
                      </Button>
                      <Button 
                        variant={isCopied ? "secondary" : "outline"}
                        className="flex-col h-auto py-4 gap-2"
                        onClick={handleCopyLink}
                      >
                        {isCopied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                        <span className="text-xs">{isCopied ? "Copied!" : "Copy Link"}</span>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                <Button 
                  className="w-full" 
                  onClick={() => {
                    if (!user) {
                      toast.info("Please log in to submit your entry");
                      navigate("/auth");
                      return;
                    }
                    navigate(`/submit/${contest.id}`);
                  }}
                >
                  Submit Your Entry
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Submissions Gallery */}
      {submissions.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t border-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-primary" />
                Submissions Gallery
              </h2>
              <p className="text-muted-foreground mt-1">
                {submissions.length} approved {submissions.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {submissions.map((submission) => (
              <div 
                key={submission.id}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-all"
                onClick={() => setSelectedImage(submission)}
              >
                <img 
                  src={submission.image_url} 
                  alt={submission.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-medium text-foreground truncate">{submission.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {submission.profiles?.avatar_url ? (
                        <img 
                          src={submission.profiles.avatar_url} 
                          alt="" 
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground truncate">
                        {submission.profiles?.full_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                </div>
                {submission.status === 'winner' && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Winner
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMoreSubmissions && (
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                size="lg"
                onClick={loadMoreSubmissions}
                disabled={isLoadingMore}
                className="min-w-[200px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <span className="ml-2 text-muted-foreground text-sm">
                      ({submissions.length} of {totalApproved})
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Showing all indicator */}
          {!hasMoreSubmissions && submissions.length > SUBMISSIONS_PER_PAGE && (
            <p className="text-center text-muted-foreground text-sm mt-8">
              Showing all {submissions.length} entries
            </p>
          )}
        </section>
      )}

      <Footer />

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
          {selectedImage && (
            <div className="flex flex-col">
              <div className="relative aspect-[4/3] md:aspect-[16/10]">
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.title}
                  className="w-full h-full object-contain bg-black/50"
                />
                {selectedImage.status === 'winner' && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    Winner
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {selectedImage.title}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  {selectedImage.profiles?.avatar_url ? (
                    <img 
                      src={selectedImage.profiles.avatar_url} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {selectedImage.profiles?.full_name || 'Anonymous'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
