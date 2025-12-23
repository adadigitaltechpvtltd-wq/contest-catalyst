import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
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
  Eye
} from 'lucide-react';

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';

interface Submission {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  status: SubmissionStatus;
  originality_confirmed: boolean;
  exif_camera_make: string | null;
  exif_camera_model: string | null;
  exif_date_taken: string | null;
  exif_has_anomalies: boolean;
  exif_anomaly_reasons: string[] | null;
  ai_probability_score: number;
  visual_anomaly_score: number;
  risk_score: number;
  report_count: number;
  admin_score: number | null;
  admin_notes: string | null;
  created_at: string;
  contest: {
    id: string;
    title: string;
    status: string;
  };
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

const AdminSubmissions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'pending';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review form state
  const [reviewScore, setReviewScore] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'disqualify' | 'winner'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('submissions')
      .select(`
        id,
        title,
        description,
        image_url,
        status,
        originality_confirmed,
        exif_camera_make,
        exif_camera_model,
        exif_date_taken,
        exif_has_anomalies,
        exif_anomaly_reasons,
        ai_probability_score,
        visual_anomaly_score,
        risk_score,
        report_count,
        admin_score,
        admin_notes,
        created_at,
        contest:contests(id, title, status),
        profile:profiles(id, full_name, email)
      `)
      .order('risk_score', { ascending: false });

    if (statusFilter !== 'all' && ['pending', 'approved', 'rejected', 'winner', 'disqualified'].includes(statusFilter)) {
      query = query.eq('status', statusFilter as SubmissionStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
    } else {
      setSubmissions(data as unknown as Submission[]);
    }
    setIsLoading(false);
  };

  const openReviewModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewScore(submission.admin_score?.toString() || '');
    setReviewNotes(submission.admin_notes || '');
    setReviewAction('approve');
    setRejectionReason('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission || !user) return;

    setIsSubmittingReview(true);

    const newStatus: SubmissionStatus = 
      reviewAction === 'approve' ? 'approved' :
      reviewAction === 'reject' ? 'rejected' :
      reviewAction === 'disqualify' ? 'disqualified' : 'winner';

    const { error } = await supabase
      .from('submissions')
      .update({
        status: newStatus,
        admin_score: reviewScore ? parseFloat(reviewScore) : null,
        admin_notes: reviewNotes || null,
        rejection_reason: (newStatus === 'rejected' || newStatus === 'disqualified') ? rejectionReason : null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selectedSubmission.id);

    if (error) {
      toast({
        title: 'Failed to submit review',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Review submitted',
        description: `Submission ${newStatus === 'approved' ? 'approved' : newStatus === 'winner' ? 'selected as winner' : 'rejected'}.`,
      });
      setIsReviewModalOpen(false);
      fetchSubmissions();
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Review Submissions</h1>
          <p className="text-muted-foreground">Review and moderate photo submissions</p>
        </div>
      </div>

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
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="p-2 rounded bg-secondary/50 text-center">
                    <p className="text-muted-foreground">AI Score</p>
                    <p className={`font-bold ${getRiskColor(submission.ai_probability_score)}`}>
                      {(submission.ai_probability_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-2 rounded bg-secondary/50 text-center">
                    <p className="text-muted-foreground">Visual</p>
                    <p className={`font-bold ${getRiskColor(submission.visual_anomaly_score)}`}>
                      {(submission.visual_anomaly_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-2 rounded bg-secondary/50 text-center">
                    <p className="text-muted-foreground">Risk</p>
                    <p className={`font-bold ${getRiskColor(submission.risk_score)}`}>
                      {(submission.risk_score * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

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

                <Button
                  className="w-full"
                  onClick={() => openReviewModal(submission)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
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
                      <CardTitle className="text-sm">Detection Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>AI Probability:</span>
                        <span className={`font-bold ${getRiskColor(selectedSubmission.ai_probability_score)}`}>
                          {(selectedSubmission.ai_probability_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Visual Anomaly:</span>
                        <span className={`font-bold ${getRiskColor(selectedSubmission.visual_anomaly_score)}`}>
                          {(selectedSubmission.visual_anomaly_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
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
