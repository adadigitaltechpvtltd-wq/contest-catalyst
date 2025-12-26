import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trophy,
  Users,
  Clock,
  Edit,
  Eye,
  Loader2,
  Crown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type ContestStatus = 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';

interface Contest {
  id: string;
  slug: string | null;
  title: string;
  theme: string | null;
  prize_amount: number;
  min_participants: number;
  start_date: string;
  end_date: string;
  status: ContestStatus;
  created_at: string;
  submission_count: number;
  winner_id: string | null;
}

const AdminContests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forceCompleteContest, setForceCompleteContest] = useState<Contest | null>(null);
  const [isForceCompleting, setIsForceCompleting] = useState(false);
  const [cancelContest, setCancelContest] = useState<Contest | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notifyParticipants, setNotifyParticipants] = useState(true);

  const fetchContests = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('contests')
        .select(
          `
          id,
          slug,
          title,
          theme,
          prize_amount,
          min_participants,
          start_date,
          end_date,
          status,
          created_at,
          winner_id
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contests:', error);
        toast({
          title: 'Failed to load contests',
          description: error.message,
          variant: 'destructive',
        });
        setContests([]);
        return;
      }

      // Fetch submission counts
      const contestsWithCounts = await Promise.all(
        (data || []).map(async (contest) => {
          const { count, error: countError } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

          if (countError) {
            console.error('Error fetching submissions count:', countError);
          }

          return { ...contest, submission_count: count || 0 };
        })
      );

      setContests(contestsWithCounts as unknown as Contest[]);
    } catch (err: any) {
      console.error('Exception fetching contests:', err);
      toast({
        title: 'Failed to load contests',
        description: err?.message ?? 'Unexpected error',
        variant: 'destructive',
      });
      setContests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [toast]);

  const handleForceComplete = async () => {
    if (!forceCompleteContest || !user) return;

    setIsForceCompleting(true);

    try {
      // Update contest status to completed
      const { error: updateError } = await supabase
        .from('contests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', forceCompleteContest.id);

      if (updateError) throw updateError;

      // Log admin action for audit trail
      const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          action_type: 'force_complete_contest',
          entity_type: 'contest',
          entity_id: forceCompleteContest.id,
          details: {
            contest_title: forceCompleteContest.title,
            submission_count: forceCompleteContest.submission_count,
            min_participants: forceCompleteContest.min_participants,
            original_end_date: forceCompleteContest.end_date,
            force_completed_at: new Date().toISOString(),
            met_minimum: forceCompleteContest.submission_count >= forceCompleteContest.min_participants,
          },
        });

      if (logError) {
        console.error('Error logging admin action:', logError);
      }

      toast({
        title: 'Contest Completed',
        description: `"${forceCompleteContest.title}" has been marked as completed. You can now select a winner.`,
      });

      fetchContests();
    } catch (error: any) {
      console.error('Error force completing contest:', error);
      toast({
        title: 'Failed to complete contest',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsForceCompleting(false);
      setForceCompleteContest(null);
    }
  };

  const handleCancelContest = async () => {
    if (!cancelContest || !user) return;

    setIsCancelling(true);

    try {
      // Update contest status to cancelled
      const { error: updateError } = await supabase
        .from('contests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', cancelContest.id);

      if (updateError) throw updateError;

      // If notify participants is enabled, send notifications
      if (notifyParticipants && cancelContest.submission_count > 0) {
        // Get unique user IDs from submissions
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('user_id')
          .eq('contest_id', cancelContest.id);

        if (submissionsError) {
          console.error('Error fetching participants:', submissionsError);
        } else if (submissions && submissions.length > 0) {
          // Get unique user IDs
          const uniqueUserIds = [...new Set(submissions.map(s => s.user_id))];
          
          // Create notifications for each participant
          const notifications = uniqueUserIds.map(userId => ({
            user_id: userId,
            type: 'warning',
            title: 'Contest Cancelled',
            message: `The contest "${cancelContest.title}" has been cancelled. We apologize for any inconvenience.`,
            link: `/contests`,
          }));

          const { error: notifyError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notifyError) {
            console.error('Error sending notifications:', notifyError);
          }
        }
      }

      // Log admin action for audit trail
      const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          action_type: 'cancel_contest',
          entity_type: 'contest',
          entity_id: cancelContest.id,
          details: {
            contest_title: cancelContest.title,
            submission_count: cancelContest.submission_count,
            notified_participants: notifyParticipants,
            cancelled_at: new Date().toISOString(),
          },
        });

      if (logError) {
        console.error('Error logging admin action:', logError);
      }

      toast({
        title: 'Contest Cancelled',
        description: `"${cancelContest.title}" has been cancelled.${notifyParticipants && cancelContest.submission_count > 0 ? ' Participants have been notified.' : ''}`,
      });

      fetchContests();
    } catch (error: any) {
      console.error('Error cancelling contest:', error);
      toast({
        title: 'Failed to cancel contest',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
      setCancelContest(null);
      setNotifyParticipants(true);
    }
  };

  const getStatusBadge = (status: ContestStatus) => {
    const variants: Record<ContestStatus, { class: string; label: string }> = {
      draft: { class: 'bg-secondary', label: 'Draft' },
      active: { class: 'bg-success', label: 'Active' },
      voting: { class: 'bg-accent', label: 'Voting' },
      completed: { class: 'bg-blue-500', label: 'Completed' },
      cancelled: { class: 'bg-destructive', label: 'Cancelled' },
    };
    const v = variants[status];
    return <Badge className={v.class}>{v.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Check if force complete should be visible
  const canForceComplete = (contest: Contest) => {
    return contest.status === 'active';
  };

  // Check if cancel should be visible
  const canCancel = (contest: Contest) => {
    return contest.status === 'active' || contest.status === 'draft' || contest.status === 'voting';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Contests</h1>
          <p className="text-muted-foreground">Manage photography contests</p>
        </div>
        <Button asChild className="gradient-primary">
          <Link to="/admin/contests/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Contest
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contests.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Contests Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first photography contest to get started.
            </p>
            <Button asChild>
              <Link to="/admin/contests/new">Create Contest</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contests.map((contest) => {
            const isEnded = new Date(contest.end_date) <= new Date();
            const needsWinner = isEnded && !contest.winner_id && contest.status !== 'cancelled';
            const showForceComplete = canForceComplete(contest);
            const showCancel = canCancel(contest);
            
            return (
              <Card key={contest.id} className={`glass-card ${needsWinner ? 'border-amber-500/50' : ''} ${contest.status === 'cancelled' ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{contest.title}</h3>
                        {getStatusBadge(contest.status)}
                        {contest.winner_id && (
                          <Badge className="bg-yellow-500 text-black">
                            <Crown className="h-3 w-3 mr-1" />
                            Winner Selected
                          </Badge>
                        )}
                        {needsWinner && (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">
                            Needs Winner
                          </Badge>
                        )}
                      </div>
                      {contest.theme && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Theme: {contest.theme}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          ${contest.prize_amount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {contest.submission_count} / {contest.min_participants} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(contest.start_date)} - {formatDate(contest.end_date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/contest/${contest.slug || contest.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {contest.status !== 'cancelled' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/contests/${contest.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      )}
                      {showForceComplete && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                          onClick={() => setForceCompleteContest(contest)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Force Complete
                        </Button>
                      )}
                      {showCancel && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => setCancelContest(contest)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {needsWinner ? (
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild>
                          <Link to={`/admin/contests/${contest.id}/winner`}>
                            <Crown className="h-4 w-4 mr-1" />
                            Select Winner
                          </Link>
                        </Button>
                      ) : contest.status === 'completed' && !contest.winner_id ? (
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild>
                          <Link to={`/admin/contests/${contest.id}/winner`}>
                            <Crown className="h-4 w-4 mr-1" />
                            Select Winner
                          </Link>
                        </Button>
                      ) : contest.status !== 'cancelled' ? (
                        <Button size="sm" asChild>
                          <Link to="/admin/submissions">
                            Review ({contest.submission_count})
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Force Complete Confirmation Dialog */}
      <AlertDialog open={!!forceCompleteContest} onOpenChange={(open) => !open && setForceCompleteContest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Complete Contest?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will immediately end the contest and move it to completion.</p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>No new submissions will be allowed</li>
                  <li>Winners can be selected</li>
                  <li>Prizes and payouts can proceed normally</li>
                </ul>
                {forceCompleteContest && forceCompleteContest.submission_count < forceCompleteContest.min_participants && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-amber-200 text-sm">
                    <strong>Note:</strong> This contest has only {forceCompleteContest.submission_count} submissions, 
                    which is below the minimum requirement of {forceCompleteContest.min_participants}.
                  </div>
                )}
                <p className="font-semibold text-destructive">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isForceCompleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceComplete}
              disabled={isForceCompleting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isForceCompleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Yes, Complete Contest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Contest Confirmation Dialog */}
      <AlertDialog open={!!cancelContest} onOpenChange={(open) => { if (!open) { setCancelContest(null); setNotifyParticipants(true); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Contest?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will permanently cancel the contest "{cancelContest?.title}".</p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>No new submissions will be allowed</li>
                  <li>No winner can be selected</li>
                  <li>No prizes will be awarded</li>
                  <li>The contest will be marked as cancelled</li>
                </ul>
                {cancelContest && cancelContest.submission_count > 0 && (
                  <div className="bg-muted/50 border border-border rounded-md p-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This contest has {cancelContest.submission_count} submission{cancelContest.submission_count !== 1 ? 's' : ''}.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="notify-participants" 
                        checked={notifyParticipants}
                        onCheckedChange={(checked) => setNotifyParticipants(checked as boolean)}
                      />
                      <Label 
                        htmlFor="notify-participants" 
                        className="text-sm font-normal cursor-pointer"
                      >
                        Notify all participants about cancellation
                      </Label>
                    </div>
                  </div>
                )}
                <p className="font-semibold text-destructive">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelContest}
              disabled={isCancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Yes, Cancel Contest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContests;