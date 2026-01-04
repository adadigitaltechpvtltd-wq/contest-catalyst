import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminSubmissionsQuery, AdminSubmission } from '@/hooks/useAdminSubmissionsQuery';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { validateTitle, isTitleBarelyPassing, generateSlugFromTitle } from '@/lib/titleValidation';
import ErrorState from '@/components/ErrorState';
import { 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Trophy,
  Clock,
  Camera,
  Flag,
  User,
  Calendar,
  Eye,
  RefreshCw,
  Zap,
  Search,
  FileText,
  Info
} from 'lucide-react';

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';

interface AnalysisProgress {
  submission_id: string;
  module: string;
  progress: number;
  status: 'running' | 'completed' | 'error';
  details?: string;
}

const MODULE_LABELS: Record<string, string> = {
  init: 'Initializing',
  fetch: 'Downloading Image',
  exif: 'EXIF Analysis',
  quality: 'Quality Analysis',
  duplicate: 'Duplicate Check',
  scoring: 'Calculating Scores',
  saving: 'Saving Results',
  complete: 'Complete',
  batch: 'Batch Processing',
  error: 'Error',
};

const AdminSubmissions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'pending';

  const { data: submissions = [], isLoading, isError, refetch } = useAdminSubmissionsQuery(statusFilter);

  const [selectedSubmission, setSelectedSubmission] = useState<AdminSubmission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review form state
  const [reviewScore, setReviewScore] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'disqualify' | 'winner'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [analyzingSubmissionId, setAnalyzingSubmissionId] = useState<string | null>(null);
  const [seoApproval, setSeoApproval] = useState(false);

  // SEO enhancement state
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [enhancedTitle, setEnhancedTitle] = useState('');
  const [enhancedDescription, setEnhancedDescription] = useState('');

  // Batch analysis state
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<AnalysisProgress | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, AnalysisProgress>>({});

  // Subscribe to real-time progress updates
  useEffect(() => {
    let isSubscribed = true;
    const channel = supabase.channel('analysis-progress');
    
    channel.on('broadcast', { event: 'progress' }, (payload) => {
      if (!isSubscribed) return;
      
      const progress = payload.payload as AnalysisProgress;
      
      if (progress.module === 'batch') {
        setBatchProgress(progress);
        if (progress.status === 'completed') {
          setTimeout(() => {
            if (isSubscribed) {
              setBatchProgress(null);
              setIsBatchAnalyzing(false);
              queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
            }
          }, 1500);
        }
      } else {
        setAnalysisProgress(prev => ({
          ...prev,
          [progress.submission_id]: progress,
        }));
        
        if (progress.status === 'completed' || progress.status === 'error') {
          setTimeout(() => {
            if (isSubscribed) {
              setAnalysisProgress(prev => {
                const next = { ...prev };
                delete next[progress.submission_id];
                return next;
              });
            }
          }, 2000);
        }
      }
    });

    channel.subscribe((status) => {
      console.log('Admin analysis progress subscription status:', status);
    });

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleReanalyze = async (submissionId: string) => {
    setAnalyzingSubmissionId(submissionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-submission', {
        body: { submission_id: submissionId }
      });

      if (error) {
        console.error('Re-analyze error:', error);
        toast({
          title: 'Analysis failed',
          description: error.message || 'Failed to trigger analysis',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Analysis complete',
        description: `Scores updated: System ${data.scores?.system_score?.toFixed(0) || 'N/A'}/100`,
      });

      // Refresh the submissions list
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      
      // Update selected submission if it's the one being analyzed
      if (selectedSubmission?.id === submissionId) {
        const { data: updated } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .single();
        
        if (updated) {
          setSelectedSubmission(updated as unknown as AdminSubmission);
        }
      }
    } catch (err) {
      console.error('Re-analyze exception:', err);
      toast({
        title: 'Analysis failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingSubmissionId(null);
    }
  };

  const handleBatchAnalyze = async () => {
    const pendingSubmissions = submissions.filter(s => !s.analysis_completed_at || s.status === 'pending');
    
    if (pendingSubmissions.length === 0) {
      toast({
        title: 'No submissions to analyze',
        description: 'All submissions have already been analyzed.',
      });
      return;
    }

    setIsBatchAnalyzing(true);
    setBatchProgress({
      submission_id: 'batch',
      module: 'batch',
      progress: 0,
      status: 'running',
      details: `Starting analysis of ${pendingSubmissions.length} submissions...`,
    });

    try {
      const submissionIds = pendingSubmissions.map(s => s.id);
      
      const { data, error } = await supabase.functions.invoke('analyze-submission', {
        body: { batch_ids: submissionIds }
      });

      if (error) {
        console.error('Batch analysis error:', error);
        toast({
          title: 'Batch analysis failed',
          description: error.message || 'Failed to trigger batch analysis',
          variant: 'destructive',
        });
        setIsBatchAnalyzing(false);
        setBatchProgress(null);
        return;
      }

      toast({
        title: 'Batch analysis complete',
        description: `Analyzed ${data.results?.length || 0} submissions`,
      });
    } catch (err) {
      console.error('Batch analysis exception:', err);
      toast({
        title: 'Batch analysis failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsBatchAnalyzing(false);
      setBatchProgress(null);
    }
  };

  const pendingAnalysisCount = submissions.filter(s => !s.analysis_completed_at || s.status === 'pending').length;

  const openReviewModal = (submission: AdminSubmission) => {
    setSelectedSubmission(submission);
    setReviewScore(submission.admin_score?.toString() || '');
    setReviewNotes(submission.admin_notes || '');
    setReviewAction('approve');
    setRejectionReason('');
    setSeoApproval(submission.seo_approved || false);
    // Initialize SEO fields
    setSeoTitle(submission.seo_title || '');
    setSeoDescription(submission.meta_description || '');
    setEnhancedTitle(submission.title || '');
    setEnhancedDescription(submission.description || '');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission || !user) return;

    setIsSubmittingReview(true);

    const newStatus: SubmissionStatus = 
      reviewAction === 'approve' ? 'approved' :
      reviewAction === 'reject' ? 'rejected' :
      reviewAction === 'disqualify' ? 'disqualified' : 'winner';

    // Calculate combined score if admin provides a score
    // Formula: 60% System Score + 40% Admin Score
    const adminScoreNum = reviewScore ? parseFloat(reviewScore) : null;
    const systemScore = selectedSubmission.system_score || 0;
    let combinedScore = null;
    
    if (adminScoreNum !== null) {
      // Combined score: 60% system score + 40% admin score
      combinedScore = (systemScore * 0.6) + (adminScoreNum * 0.4);
    }

    try {
      // Determine if we need to regenerate slug (title was changed or slug is missing)
      const titleSource = enhancedTitle || selectedSubmission.title;
      const titleChanged = Boolean(enhancedTitle && enhancedTitle !== selectedSubmission.title);
      const newSlug = (titleChanged || !selectedSubmission.slug)
        ? generateSlugFromTitle(titleSource)
        : selectedSubmission.slug;
      
      // Check title quality for flagging
      const titleToCheck = enhancedTitle || selectedSubmission.title;
      const titleValidation = validateTitle(titleToCheck);
      const titleQualityFlag = titleValidation.isValid 
        ? (isTitleBarelyPassing(titleToCheck) ? 'medium' : null)
        : 'low';

      // Update the submission with SEO fields
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          admin_score: adminScoreNum,
          combined_score: combinedScore,
          admin_notes: reviewNotes || null,
          rejection_reason: (newStatus === 'rejected' || newStatus === 'disqualified') ? rejectionReason : null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          // Title and slug - regenerate slug if title changed
          title: enhancedTitle || selectedSubmission.title,
          slug: newSlug,
          title_quality_flag: titleQualityFlag,
          description: enhancedDescription || selectedSubmission.description,
          seo_title: seoTitle || null,
          meta_description: seoDescription || null,
          seo_approved: (newStatus === 'approved' || newStatus === 'winner') ? seoApproval : false,
        })
        .eq('id', selectedSubmission.id);

      if (submissionError) {
        toast({
          title: 'Failed to submit review',
          description: submissionError.message,
          variant: 'destructive',
        });
        setIsSubmittingReview(false);
        return;
      }

      // If SEO is approved, generate the public HTML page immediately (so it works even if seo_approved was already true)
      if (seoApproval && (newStatus === 'approved' || newStatus === 'winner')) {
        supabase.functions
          .invoke('generate-seo-page', {
            body: { submission_id: selectedSubmission.id },
          })
          .then(({ error }) => {
            if (error) {
              toast({
                title: 'SEO page generation failed',
                description: error.message,
                variant: 'destructive',
              });
              return;
            }

            toast({
              title: 'SEO page generated',
              description: 'Public page created in Storage for indexing.',
            });
            queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
          });
      }

      // If marking as winner, also update the contest with winner info, create wallet transaction, and send notification
      if (newStatus === 'winner' && selectedSubmission.contest?.id) {
        const { error: contestError } = await supabase
          .from('contests')
          .update({
            winner_id: selectedSubmission.profile?.id,
            winning_submission_id: selectedSubmission.id,
            status: 'completed',
          })
          .eq('id', selectedSubmission.contest.id);

        if (contestError) {
          console.error('Failed to update contest with winner:', contestError);
          toast({
            title: 'Warning',
            description: 'Submission marked as winner but contest update failed. Please update contest manually.',
            variant: 'destructive',
          });
        }

        // Create wallet transaction for prize (pending status)
        const prizeAmount = selectedSubmission.contest.prize_amount || 0;
        const prizeCurrency = selectedSubmission.contest.prize_currency || 'USD';
        
        if (prizeAmount > 0 && selectedSubmission.profile?.id) {
          const { error: walletError } = await supabase
            .from('wallet_transactions')
            .insert({
              user_id: selectedSubmission.profile.id,
              contest_id: selectedSubmission.contest.id,
              submission_id: selectedSubmission.id,
              type: 'prize',
              amount: prizeAmount,
              currency: prizeCurrency,
              status: 'pending',
              notes: `Prize for winning "${selectedSubmission.contest.title}"`,
            });

          if (walletError) {
            console.error('Error creating wallet transaction:', walletError);
            toast({
              title: 'Warning',
              description: 'Winner selected but wallet transaction failed. Please add manually.',
              variant: 'destructive',
            });
          }
        }

        // Create notification for the winner
        if (selectedSubmission.profile?.id) {
          await supabase.from('notifications').insert({
            user_id: selectedSubmission.profile.id,
            type: 'success',
            title: '🏆 Congratulations! You Won!',
            message: `You've won the "${selectedSubmission.contest.title}" contest! Prize: $${prizeAmount}. Your earnings will be transferred soon.`,
            link: `/campaign/${selectedSubmission.contest.category || 'general'}/${selectedSubmission.contest.slug || selectedSubmission.contest.id}`,
          });
        }
      }

      toast({
        title: 'Review submitted',
        description: `Submission ${newStatus === 'approved' ? 'approved' : newStatus === 'winner' ? 'selected as winner' : 'rejected'}.`,
      });
      setIsReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
    } catch (err) {
      console.error('Review submission error:', err);
      toast({
        title: 'Failed to submit review',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }

    setIsSubmittingReview(false);
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'text-destructive';
    if (score >= 0.4) return 'text-amber-500';
    return 'text-success';
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    const variants: Record<SubmissionStatus, { class: string; icon: any }> = {
      pending: { class: 'bg-secondary', icon: Clock },
      approved: { class: 'bg-success', icon: CheckCircle },
      rejected: { class: 'bg-destructive', icon: XCircle },
      winner: { class: 'bg-accent', icon: Trophy },
      disqualified: { class: 'bg-destructive', icon: AlertTriangle },
    };
    const v = variants[status];
    const Icon = v.icon;
    return (
      <Badge className={`${v.class} gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isError) {
    return (
      <ErrorState 
        title="Failed to load submissions" 
        message="Could not load submissions data." 
        onRetry={refetch} 
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Review Submissions</h1>
          <p className="text-muted-foreground">Review and moderate photo submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleBatchAnalyze}
            disabled={isBatchAnalyzing || pendingAnalysisCount === 0}
            className="gap-2"
          >
            {isBatchAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Analyze All ({pendingAnalysisCount})
          </Button>
        </div>
      </div>

      {/* Batch Analysis Progress */}
      {batchProgress && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">Batch Analysis in Progress</p>
                <p className="text-sm text-muted-foreground">{batchProgress.details}</p>
              </div>
              <Badge variant="secondary">{batchProgress.progress}%</Badge>
            </div>
            <Progress value={batchProgress.progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'winner', 'all'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchParams({ status })}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : submissions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Submissions Found</h3>
            <p className="text-muted-foreground">
              No {statusFilter !== 'all' ? statusFilter : ''} submissions to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => (
            <Card key={submission.id} className="glass-card overflow-hidden">
              <div className="relative aspect-video">
                <img
                  src={submission.image_url}
                  alt={submission.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  {getStatusBadge(submission.status)}
                </div>
                {submission.report_count > 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="gap-1">
                      <Flag className="h-3 w-3" />
                      {submission.report_count}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 truncate">{submission.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {submission.profile?.full_name || 'Unknown'} • {submission.contest?.title}
                </p>

                {/* Risk Indicators */}
                <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                  <div className="p-2 rounded bg-secondary/50 text-center">
                    <p className="text-muted-foreground">Visual</p>
                    <p className={`font-bold ${getRiskColor(submission.visual_anomaly_score)}`}>
                      {(submission.visual_anomaly_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-2 rounded bg-secondary/50 text-center">
                    <p className="text-muted-foreground">Duplicate</p>
                    <p className={`font-bold ${getRiskColor(submission.duplicate_similarity_score || 0)}`}>
                      {((submission.duplicate_similarity_score || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-2 rounded bg-secondary/50 text-center">
                    <p className="text-muted-foreground">Quality</p>
                    <p className="font-bold text-primary">
                      {(submission.image_quality_score || 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Scores Row */}
                <div className="flex justify-between items-center mb-3 text-xs p-2 rounded bg-primary/10">
                  <div className="text-center">
                    <p className="text-muted-foreground">System</p>
                    <p className="font-bold text-primary">{(submission.system_score || 0).toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Admin</p>
                    <p className="font-bold">{submission.admin_score ?? '-'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Combined</p>
                    <p className="font-bold text-accent">{submission.combined_score?.toFixed(0) ?? '-'}</p>
                  </div>
                </div>

                {/* Analysis Progress Indicator */}
                {analysisProgress[submission.id] && (
                  <div className="mb-3 p-2 rounded bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      <span className="font-medium text-primary">
                        {MODULE_LABELS[analysisProgress[submission.id].module] || analysisProgress[submission.id].module}
                      </span>
                    </div>
                    <Progress value={analysisProgress[submission.id].progress} className="h-1" />
                  </div>
                )}

                {/* Analysis Status */}
                {!submission.analysis_completed_at && !analysisProgress[submission.id] && (
                  <div className="flex items-center gap-2 text-xs text-amber-500 mb-3">
                    <Clock className="h-3 w-3 animate-pulse" />
                    Analysis pending...
                  </div>
                )}

                {/* EXIF Info */}
                {submission.exif_camera_model && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Camera className="h-3 w-3" />
                    {submission.exif_camera_make} {submission.exif_camera_model}
                  </div>
                )}

                {submission.exif_has_anomalies && (
                  <div className="flex items-center gap-2 text-xs text-amber-500 mb-3">
                    <AlertTriangle className="h-3 w-3" />
                    EXIF anomalies detected
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={analyzingSubmissionId === submission.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReanalyze(submission.id);
                    }}
                  >
                    {analyzingSubmissionId === submission.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => openReviewModal(submission)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>Review Submission</DialogTitle>
                <DialogDescription>
                  Review and score this photo submission
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div>
                  <img
                    src={selectedSubmission.image_url}
                    alt={selectedSubmission.title}
                    className="w-full rounded-lg"
                  />
                </div>

                {/* Details & Review Form */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedSubmission.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.description}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSubmission.profile?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSubmission.contest?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(selectedSubmission.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Detection Scores */}
                  <Card className="bg-secondary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Detection Analysis</span>
                        <div className="flex items-center gap-2">
                          {selectedSubmission.analysis_completed_at && (
                            <span className="text-xs font-normal text-muted-foreground">
                              {new Date(selectedSubmission.analysis_completed_at).toLocaleDateString()}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            disabled={analyzingSubmissionId === selectedSubmission.id}
                            onClick={() => handleReanalyze(selectedSubmission.id)}
                          >
                            {analyzingSubmissionId === selectedSubmission.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Visual Anomaly:</span>
                        <span className={`font-bold ${getRiskColor(selectedSubmission.visual_anomaly_score)}`}>
                          {(selectedSubmission.visual_anomaly_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duplicate Similarity:</span>
                        <span className={`font-bold ${getRiskColor(selectedSubmission.duplicate_similarity_score)}`}>
                          {((selectedSubmission.duplicate_similarity_score || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Image Quality:</span>
                        <span className="font-bold text-primary">
                          {(selectedSubmission.image_quality_score || 0).toFixed(0)}/100
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 mt-2">
                        <span>Overall Risk:</span>
                        <span className={`font-bold ${getRiskColor(selectedSubmission.risk_score)}`}>
                          {(selectedSubmission.risk_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reports:</span>
                        <span className={selectedSubmission.report_count > 0 ? 'text-destructive font-bold' : ''}>
                          {selectedSubmission.report_count}
                        </span>
                      </div>
                      {selectedSubmission.exif_camera_model && (
                        <div className="flex justify-between">
                          <span>Camera:</span>
                          <span>{selectedSubmission.exif_camera_make} {selectedSubmission.exif_camera_model}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Scoring Summary */}
                  <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Scoring Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>System Score:</span>
                        <span className="font-bold text-primary">
                          {(selectedSubmission.system_score || 0).toFixed(1)}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Admin Score:</span>
                        <span className="font-bold">
                          {selectedSubmission.admin_score !== null ? `${selectedSubmission.admin_score}/100` : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-primary/20 pt-2 mt-2">
                        <span className="font-semibold">Combined Score:</span>
                        <span className="font-bold text-lg text-accent">
                          {selectedSubmission.combined_score !== null 
                            ? `${selectedSubmission.combined_score.toFixed(1)}/100` 
                            : 'Pending review'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Combined = 40% System + 60% Admin Score
                      </p>
                    </CardContent>
                  </Card>

                  {/* SEO Enhancement Section */}
                  <Card className="bg-secondary/30 border-secondary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        SEO Enhancement
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Improve titles and descriptions for better search visibility
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title Quality Warning */}
                      {(() => {
                        const titleValidation = validateTitle(selectedSubmission.title);
                        const barelyPassing = isTitleBarelyPassing(selectedSubmission.title);
                        return (
                          <>
                            {barelyPassing && (
                              <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded border border-amber-500/30">
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <p className="font-medium text-amber-500">Title barely passes validation</p>
                                  <p className="text-muted-foreground">Consider improving the title before approving.</p>
                                </div>
                              </div>
                            )}
                            {!titleValidation.isValid && (
                              <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded border border-destructive/30">
                                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <p className="font-medium text-destructive">Title does not meet quality standards</p>
                                  <p className="text-muted-foreground">{titleValidation.errors[0]}</p>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {/* Original vs Enhanced Title */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Original Title</Label>
                        <p className="text-sm p-2 bg-background/50 rounded border border-border/50">
                          {selectedSubmission.title}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Enhanced Title
                          <span className="text-xs text-muted-foreground">
                            ({enhancedTitle.length}/100)
                          </span>
                          {enhancedTitle !== selectedSubmission.title && (
                            <Badge variant="outline" className="text-xs">Modified</Badge>
                          )}
                        </Label>
                        <Input
                          value={enhancedTitle}
                          onChange={(e) => setEnhancedTitle(e.target.value)}
                          placeholder="Enter SEO-friendly title..."
                          maxLength={100}
                        />
                        {enhancedTitle !== selectedSubmission.title && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Slug will be regenerated: {generateSlugFromTitle(enhancedTitle)}
                          </p>
                        )}
                      </div>

                      {/* Original vs Enhanced Description */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Original Description</Label>
                        <p className="text-sm p-2 bg-background/50 rounded border border-border/50 min-h-[40px]">
                          {selectedSubmission.description || <span className="text-muted-foreground italic">No description provided</span>}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Enhanced Description
                          <span className="text-xs text-muted-foreground">
                            ({enhancedDescription.length}/500)
                          </span>
                        </Label>
                        <Textarea
                          value={enhancedDescription}
                          onChange={(e) => setEnhancedDescription(e.target.value)}
                          placeholder="Enter descriptive text for the photo..."
                          maxLength={500}
                          rows={3}
                        />
                      </div>

                      {/* SEO Meta Fields */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Meta Tags</span>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs">
                              SEO Title (for search engines)
                              <span className="text-muted-foreground">
                                ({seoTitle.length}/60)
                              </span>
                            </Label>
                            <Input
                              value={seoTitle}
                              onChange={(e) => setSeoTitle(e.target.value)}
                              placeholder="Photo title for search results..."
                              maxLength={60}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs">
                              Meta Description
                              <span className="text-muted-foreground">
                                ({seoDescription.length}/160)
                              </span>
                            </Label>
                            <Textarea
                              value={seoDescription}
                              onChange={(e) => setSeoDescription(e.target.value)}
                              placeholder="Brief description for search results..."
                              maxLength={160}
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>

                      {/* SEO Preview */}
                      {(seoTitle || enhancedTitle) && (
                        <div className="p-3 bg-background rounded border border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Search Preview:</p>
                          <p className="text-sm font-medium text-primary truncate">
                            {seoTitle || enhancedTitle} | GAAL Photo Contest
                          </p>
                          <p className="text-xs text-success truncate">
                            gaal.app/photo/{selectedSubmission.contest?.title?.toLowerCase().replace(/\s+/g, '-')}/{selectedSubmission.slug || 'photo-slug'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {seoDescription || enhancedDescription || 'No description available'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Review Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select value={reviewAction} onValueChange={(v) => setReviewAction(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">Approve</SelectItem>
                          <SelectItem value="reject">Reject</SelectItem>
                          <SelectItem value="disqualify">Disqualify</SelectItem>
                          <SelectItem value="winner">Select as Winner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(reviewAction === 'approve' || reviewAction === 'winner') && (
                      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded border border-primary/20">
                        <input
                          type="checkbox"
                          id="seoApproval"
                          checked={seoApproval}
                          onChange={(e) => setSeoApproval(e.target.checked)}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        <label htmlFor="seoApproval" className="text-sm font-medium cursor-pointer flex-1">
                          Generate SEO page for Google indexing
                        </label>
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Score (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={reviewScore}
                        onChange={(e) => setReviewScore(e.target.value)}
                        placeholder="Enter score"
                      />
                    </div>

                    {(reviewAction === 'reject' || reviewAction === 'disqualify') && (
                      <div className="space-y-2">
                        <Label>Rejection Reason *</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this submission is being rejected..."
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Admin Notes (Internal)</Label>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Internal notes about this submission..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsReviewModalOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview || ((reviewAction === 'reject' || reviewAction === 'disqualify') && !rejectionReason)}
                        className={`flex-1 ${reviewAction === 'approve' || reviewAction === 'winner' ? 'bg-success hover:bg-success/90' : ''}`}
                      >
                        {isSubmittingReview ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          reviewAction === 'approve' ? 'Approve' :
                          reviewAction === 'winner' ? 'Select Winner' :
                          'Reject'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;
