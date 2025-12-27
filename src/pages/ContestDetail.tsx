import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, Users, Trophy, CheckCircle, Share2, Calendar, Loader2, Eye, Image as ImageIcon, User, Instagram, Twitter, Linkedin, Copy, Check, ChevronLeft, ChevronRight, Download, Heart, Facebook, X, Youtube, ExternalLink, Building2 } from "lucide-react";
import ContestDetailSkeleton from "@/components/skeletons/ContestDetailSkeleton";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubmissionModal from "@/components/SubmissionModal";
import InlineAuthDialog from "@/components/InlineAuthDialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  useContestDetailQuery, 
  useContestParticipantCount, 
  useUserContestSubmission,
  useContestApprovedCount,
  useContestSubmissionsInfinite,
  useUserSubmissionLikes,
  Contest,
  ContestSubmission 
} from "@/hooks/useContestDetailQuery";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const ContestDetail = () => {
  const { category, slug } = useParams<{ category?: string; slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ContestSubmission | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [pendingLikeSubmissionId, setPendingLikeSubmissionId] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // React Query hooks
  const { data: contest, isLoading: contestLoading } = useContestDetailQuery(slug);
  const { data: participantCount = 0 } = useContestParticipantCount(contest?.id);
  const { data: userSubmission } = useUserContestSubmission(contest?.id, user?.id);
  const { data: totalApproved = 0 } = useContestApprovedCount(contest?.id);
  const { 
    data: submissionsData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useContestSubmissionsInfinite(contest?.id);

  // Flatten submissions from infinite query
  const submissions = useMemo(() => {
    return submissionsData?.pages.flatMap(page => page.submissions) || [];
  }, [submissionsData]);

  // Fetch user likes
  const submissionIds = useMemo(() => submissions.map(s => s.id), [submissions]);
  const { data: userLikes } = useUserSubmissionLikes(user?.id, submissionIds);

  useEffect(() => {
    if (userLikes) {
      setLikedImages(userLikes);
    }
  }, [userLikes]);

  // Handle legacy URL redirects
  useEffect(() => {
    if (contest && !category) {
      const contestCategory = contest.category || 'general';
      navigate(`/contest/${contestCategory}/${contest.slug || contest.id}`, { replace: true });
    } else if (contest && category) {
      const contestCategory = contest.category || 'general';
      if (category !== contestCategory) {
        navigate(`/contest/${contestCategory}/${contest.slug || contest.id}`, { replace: true });
      }
    }
  }, [contest, category, navigate]);

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
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "instagram":
        handleCopyLink();
        toast.info("Link copied! Share it on Instagram");
        return;
    }
    window.open(shareLink, "_blank", "noopener,noreferrer");
    setIsShareDialogOpen(false);
  };

  const handleImageShare = (submission: ContestSubmission, platform: string) => {
    const imageShareUrl = `${window.location.origin}/contest/${contest?.slug || slug}#submission-${submission.id}`;
    const imageShareText = `Check out "${submission.title}" on GAAL!`;
    const encodedUrl = encodeURIComponent(imageShareUrl);
    const encodedText = encodeURIComponent(imageShareText);
    
    let shareLink = "";
    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
    }
    window.open(shareLink, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLike = async (submissionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setPendingLikeSubmissionId(submissionId);
      setIsAuthDialogOpen(true);
      return;
    }

    await toggleLike(submissionId);
  };

  const toggleLike = async (submissionId: string) => {
    if (!user) return;

    const isCurrentlyLiked = likedImages.has(submissionId);

    // Optimistic update
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });

    if (selectedImage?.id === submissionId) {
      setSelectedImage(prev => prev ? {
        ...prev,
        like_count: prev.like_count + (isCurrentlyLiked ? -1 : 1)
      } : null);
    }

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("submission_likes")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("submission_likes")
          .insert({ submission_id: submissionId, user_id: user.id });

        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['contest-submissions'] });
    } catch (error) {
      // Revert on error
      setLikedImages(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(submissionId);
        } else {
          newSet.delete(submissionId);
        }
        return newSet;
      });
      toast.error("Failed to update like");
    }
  };

  const handleAuthSuccess = () => {
    if (pendingLikeSubmissionId) {
      setTimeout(() => {
        toggleLike(pendingLikeSubmissionId);
        setPendingLikeSubmissionId(null);
      }, 500);
    }
  };

  const handleDownload = async (imageUrl: string, title: string, submissionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    try {
      await supabase.rpc('increment_download_count', { submission_id_param: submissionId });

      if (selectedImage?.id === submissionId) {
        setSelectedImage(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);
      }

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
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
        return { label: "Live Now", className: "bg-primary text-primary-foreground" };
      case 'voting':
        return { label: "Voting", className: "bg-accent text-accent-foreground" };
      case 'completed':
        return { label: "Ended", className: "bg-muted text-muted-foreground" };
      case 'draft':
        return { label: "Coming Soon", className: "bg-muted text-muted-foreground" };
      default:
        return { label: status, className: "bg-muted text-muted-foreground" };
    }
  };

  const checkScrollButtons = useCallback(() => {
    if (galleryRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [submissions, checkScrollButtons]);

  const scrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const scrollAmount = galleryRef.current.clientWidth * 0.8;
      galleryRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollButtons, 300);
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, selectedImageIndex - 1)
      : Math.min(submissions.length - 1, selectedImageIndex + 1);
    
    if (newIndex !== selectedImageIndex) {
      setSelectedImageIndex(newIndex);
      setSelectedImage(submissions[newIndex]);
    }
  };

  const openImageModal = async (submission: ContestSubmission, index: number) => {
    setSelectedImage(submission);
    setSelectedImageIndex(index);

    try {
      await supabase.rpc('increment_view_count', { submission_id_param: submission.id });
      setSelectedImage(prev => prev ? { ...prev, view_count: prev.view_count + 1 } : null);
    } catch (error) {
      console.error("Failed to increment view count:", error);
    }
  };

  const getImageTags = (submission: ContestSubmission) => {
    const baseTags = ['Photography', 'Contest'];
    if (contest?.theme) baseTags.push(contest.theme);
    return baseTags;
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  if (contestLoading) {
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
            <Button>Back to Contests</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(contest.status);
  const prizeFormatted = `$${contest.prize_amount.toLocaleString()}`;

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

      {/* Contest Header Section */}
      <section className="relative pt-6 pb-8">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusDisplay.className}`}>
                    {contest.status === 'active' && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                    {statusDisplay.label}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Ends {format(new Date(contest.end_date), "MMMM d, yyyy")}
                  </span>
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {contest.title}
                </h1>

                {contest.theme && (
                  <p className="text-muted-foreground mb-2">Theme: {contest.theme}</p>
                )}

                <p className="text-muted-foreground mb-6 max-w-2xl">
                  {contest.description || "Share your best photos and compete for amazing prizes!"}
                </p>

                <div className="flex flex-wrap gap-6">
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

              <div className="flex items-start gap-3">
                {userSubmission ? (
                  <Link to="/submissions">
                    <Button size="lg" variant="secondary">
                      <Eye className="w-4 h-4 mr-2" />
                      View My Submission
                    </Button>
                  </Link>
                ) : contest.status === "active" ? (
                  <Button 
                    size="lg" 
                    onClick={() => {
                      if (!user) {
                        toast.info("Please log in to submit your entry");
                        navigate("/auth");
                        return;
                      }
                      navigate(`/submit/${contest.slug || contest.id}`);
                    }}
                  >
                    Submit Entry
                  </Button>
                ) : null}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0"
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Brand Section */}
          {contest.brand_name && (
            <div className="mt-6 bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Sponsored by {contest.brand_name}</h3>
                  {contest.brand_description && (
                    <p className="text-muted-foreground text-sm mb-3">{contest.brand_description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {contest.brand_website_url && (
                      <a href={contest.brand_website_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Website
                        </Button>
                      </a>
                    )}
                    {contest.brand_instagram_url && (
                      <a href={contest.brand_instagram_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Instagram className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {contest.brand_twitter_url && (
                      <a href={contest.brand_twitter_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Twitter className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {contest.brand_youtube_url && (
                      <a href={contest.brand_youtube_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Youtube className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold">Submissions</h2>
              <p className="text-muted-foreground text-sm">{totalApproved} photos submitted</p>
            </div>
            {submissions.length > 4 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollGallery('left')}
                  disabled={!canScrollLeft}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollGallery('right')}
                  disabled={!canScrollRight}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No submissions yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Be the first to submit your photo!</p>
              {contest.status === 'active' && (
                <Button onClick={() => navigate(`/submit/${contest.slug || contest.id}`)}>
                  Submit Now
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                ref={galleryRef}
                onScroll={checkScrollButtons}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              >
                {submissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="group relative shrink-0 w-72 snap-start cursor-pointer"
                    onClick={() => openImageModal(submission, index)}
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                      <img
                        src={submission.image_url}
                        alt={submission.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-medium truncate">{submission.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {submission.profiles?.avatar_url ? (
                              <img src={submission.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                            <span className="text-white/80 text-sm truncate max-w-[100px]">
                              {submission.profiles?.full_name || 'Anonymous'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-white/80 text-sm">
                            <span className="flex items-center gap-1">
                              <Heart className={`w-4 h-4 ${likedImages.has(submission.id) ? 'fill-primary text-primary' : ''}`} />
                              {formatCount(submission.like_count)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {submission.status === 'winner' && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Winner
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Rules & Criteria Section */}
      <section className="py-8 border-t border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-display font-bold mb-4">Contest Rules</h3>
              <ul className="space-y-3">
                {rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold mb-4">Judging Criteria</h3>
              <div className="space-y-3">
                {judgingCriteria.map((criteria, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{criteria.name}</span>
                    <span className="text-sm font-medium">{criteria.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Auth Dialog */}
      <InlineAuthDialog
        open={isAuthDialogOpen}
        onOpenChange={(open) => {
          setIsAuthDialogOpen(open);
          if (!open) setPendingLikeSubmissionId(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Share this contest</h3>
            <p className="text-sm text-muted-foreground">Spread the word about this photo contest!</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <Button variant="outline" className="flex-col h-auto py-3 gap-1.5" onClick={() => handleShare("twitter")}>
              <Twitter className="w-5 h-5" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-3 gap-1.5" onClick={() => handleShare("facebook")}>
              <Facebook className="w-5 h-5" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-3 gap-1.5" onClick={() => handleShare("linkedin")}>
              <Linkedin className="w-5 h-5" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-3 gap-1.5" onClick={() => handleShare("whatsapp")}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button variant={isCopied ? "secondary" : "outline"} className="flex-col h-auto py-3 gap-1.5" onClick={handleCopyLink}>
              {isCopied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
              <span className="text-xs">{isCopied ? "Copied!" : "Copy"}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background border-border">
          {selectedImage && (
            <div className="flex flex-col">
              <div className="relative bg-black/90">
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.title}
                  className="w-full max-h-[70vh] object-contain"
                />
                
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {selectedImageIndex > 0 && (
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {selectedImageIndex < submissions.length - 1 && (
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}

                {selectedImage.status === 'winner' && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    Winner
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-border">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">
                      {selectedImage.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedImage.profiles?.avatar_url ? (
                        <img src={selectedImage.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {selectedImage.profiles?.full_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-bold text-foreground text-lg">{formatCount(selectedImage.view_count)}</p>
                      <p className="text-xs">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-lg">{formatCount(selectedImage.download_count)}</p>
                      <p className="text-xs">Downloads</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {getImageTags(selectedImage).map((tag, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => handleLike(selectedImage.id, e)}>
                      <Heart className={`w-4 h-4 mr-2 ${likedImages.has(selectedImage.id) ? 'fill-primary text-primary' : ''}`} />
                      Like {selectedImage.like_count > 0 && `(${formatCount(selectedImage.like_count)})`}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(selectedImage.image_url, selectedImage.title, selectedImage.id)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-2">Share:</span>
                    <button onClick={() => handleImageShare(selectedImage, 'twitter')} className="p-2 rounded-full hover:bg-muted transition-colors">
                      <Twitter className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleImageShare(selectedImage, 'facebook')} className="p-2 rounded-full hover:bg-muted transition-colors">
                      <Facebook className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleImageShare(selectedImage, 'linkedin')} className="p-2 rounded-full hover:bg-muted transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Link to="/contests" className="text-sm text-primary hover:underline" onClick={() => setSelectedImage(null)}>
                    Explore more contests →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SubmissionModal 
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        contestTitle={contest.title}
      />
    </div>
  );
};

export default ContestDetail;
