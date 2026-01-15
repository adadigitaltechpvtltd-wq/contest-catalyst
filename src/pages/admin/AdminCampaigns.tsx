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
  RotateCcw,
} from 'lucide-react';

type CampaignStatus = 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';

interface Campaign {
  id: string;
  slug: string | null;
  title: string;
  theme: string | null;
  prize_amount: number;
  min_participants: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  created_at: string;
  submission_count: number;
  winner_id: string | null;
}

const AdminCampaigns = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forceCompleteCampaign, setForceCompleteCampaign] = useState<Campaign | null>(null);
  const [isForceCompleting, setIsForceCompleting] = useState(false);
  const [cancelCampaign, setCancelCampaign] = useState<Campaign | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notifyParticipants, setNotifyParticipants] = useState(true);
  const [reactivateCampaign, setReactivateCampaign] = useState<Campaign | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [notifyOnReactivate, setNotifyOnReactivate] = useState(true);

  const fetchCampaigns = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await (supabase as any)
        .from('campaigns')
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
        console.error('Error fetching campaigns:', error);
        toast({
          title: 'Failed to load campaigns',
          description: error.message,
          variant: 'destructive',
        });
        setCampaigns([]);
        return;
      }

      // Fetch submission counts
      const campaignsWithCounts = await Promise.all(
        (data || []).map(async (campaign: any) => {
          const { count, error: countError } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);

          if (countError) {
            console.error('Error fetching submissions count:', countError);
          }

          return { ...campaign, submission_count: count || 0 };
        })
      );

      setCampaigns(campaignsWithCounts as unknown as Campaign[]);
    } catch (err: any) {
      console.error('Exception fetching campaigns:', err);
      toast({
        title: 'Failed to load campaigns',
        description: err?.message ?? 'Unexpected error',
        variant: 'destructive',
      });
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [toast]);

  const handleForceComplete = async () => {
    if (!forceCompleteCampaign || !user) return;

    setIsForceCompleting(true);

    try {
      // Update campaign status to completed
      const { error: updateError } = await (supabase as any)
        .from('campaigns')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', forceCompleteCampaign.id);

      if (updateError) throw updateError;

      // Log admin action for audit trail
      const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          action_type: 'force_complete_campaign',
          entity_type: 'campaign',
          entity_id: forceCompleteCampaign.id,
          details: {
            campaign_title: forceCompleteCampaign.title,
            submission_count: forceCompleteCampaign.submission_count,
            min_participants: forceCompleteCampaign.min_participants,
            original_end_date: forceCompleteCampaign.end_date,
            force_completed_at: new Date().toISOString(),
            met_minimum: forceCompleteCampaign.submission_count >= forceCompleteCampaign.min_participants,
          },
        });

      if (logError) {
        console.error('Error logging admin action:', logError);
      }

      toast({
        title: 'Campaign Completed',
        description: `"${forceCompleteCampaign.title}" has been marked as completed. You can now select a winner.`,
      });

      fetchCampaigns();
    } catch (error: any) {
      console.error('Error force completing campaign:', error);
      toast({
        title: 'Failed to complete campaign',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsForceCompleting(false);
      setForceCompleteCampaign(null);
    }
  };

  const handleCancelCampaign = async () => {
    if (!cancelCampaign || !user) return;

    setIsCancelling(true);

    try {
      // Update campaign status to cancelled
      const { error: updateError } = await (supabase as any)
        .from('campaigns')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', cancelCampaign.id);

      if (updateError) throw updateError;

      // If notify participants is enabled, send notifications
      if (notifyParticipants && cancelCampaign.submission_count > 0) {
        // Get unique user IDs from submissions
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('user_id')
          .eq('campaign_id', cancelCampaign.id);

        if (submissionsError) {
          console.error('Error fetching participants:', submissionsError);
        } else if (submissions && submissions.length > 0) {
          // Get unique user IDs
          const uniqueUserIds = [...new Set(submissions.map(s => s.user_id))];
          
          // Create notifications for each participant
          const notifications = uniqueUserIds.map(userId => ({
            user_id: userId,
            type: 'warning',
            title: 'Campaign Cancelled',
            message: `The campaign "${cancelCampaign.title}" has been cancelled. We apologize for any inconvenience.`,
            link: `/campaigns`,
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
          action_type: 'cancel_campaign',
          entity_type: 'campaign',
          entity_id: cancelCampaign.id,
          details: {
            campaign_title: cancelCampaign.title,
            submission_count: cancelCampaign.submission_count,
            notified_participants: notifyParticipants,
            cancelled_at: new Date().toISOString(),
          },
        });

      if (logError) {
        console.error('Error logging admin action:', logError);
      }

      toast({
        title: 'Campaign Cancelled',
        description: `"${cancelCampaign.title}" has been cancelled.${notifyParticipants && cancelCampaign.submission_count > 0 ? ' Participants have been notified.' : ''}`,
      });

      fetchCampaigns();
    } catch (error: any) {
      console.error('Error cancelling campaign:', error);
      toast({
        title: 'Failed to cancel campaign',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
      setCancelCampaign(null);
      setNotifyParticipants(true);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<CampaignStatus, { class: string; label: string }> = {
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
  const canForceComplete = (campaign: Campaign) => {
    return campaign.status === 'active';
  };

  // Check if cancel should be visible
  const canCancel = (campaign: Campaign) => {
    return campaign.status === 'active' || campaign.status === 'draft' || campaign.status === 'voting';
  };

  // Check if reactivate should be visible
  const canReactivate = (campaign: Campaign) => {
    return campaign.status === 'cancelled';
  };

  const handleReactivateCampaign = async () => {
    if (!reactivateCampaign || !user) return;

    setIsReactivating(true);

    try {
      // Update campaign status to active
      const { error: updateError } = await (supabase as any)
        .from('campaigns')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reactivateCampaign.id);

      if (updateError) throw updateError;

      // If notify participants is enabled, send notifications
      if (notifyOnReactivate && reactivateCampaign.submission_count > 0) {
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('user_id')
          .eq('campaign_id', reactivateCampaign.id);

        if (submissionsError) {
          console.error('Error fetching participants:', submissionsError);
        } else if (submissions && submissions.length > 0) {
          const uniqueUserIds = [...new Set(submissions.map(s => s.user_id))];
          
          const notifications = uniqueUserIds.map(userId => ({
            user_id: userId,
            type: 'success',
            title: 'Campaign Reactivated!',
            message: `Great news! The campaign "${reactivateCampaign.title}" has been reactivated and is now accepting submissions again.`,
            link: `/campaign/${reactivateCampaign.slug || reactivateCampaign.id}`,
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
          action_type: 'reactivate_campaign',
          entity_type: 'campaign',
          entity_id: reactivateCampaign.id,
          details: {
            campaign_title: reactivateCampaign.title,
            submission_count: reactivateCampaign.submission_count,
            notified_participants: notifyOnReactivate,
            reactivated_at: new Date().toISOString(),
          },
        });

      if (logError) {
        console.error('Error logging admin action:', logError);
      }

      toast({
        title: 'Campaign Reactivated',
        description: `"${reactivateCampaign.title}" is now active again.${notifyOnReactivate && reactivateCampaign.submission_count > 0 ? ' Participants have been notified.' : ''}`,
      });

      fetchCampaigns();
    } catch (error: any) {
      console.error('Error reactivating campaign:', error);
      toast({
        title: 'Failed to reactivate campaign',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsReactivating(false);
      setReactivateCampaign(null);
      setNotifyOnReactivate(true);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage photography campaigns</p>
        </div>
        <Button asChild className="gradient-primary">
          <Link to="/admin/campaigns/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Campaigns Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first photography campaign to get started.
            </p>
            <Button asChild>
              <Link to="/admin/campaigns/new">Create Campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const isEnded = new Date(campaign.end_date) <= new Date();
            const needsWinner = isEnded && !campaign.winner_id && campaign.status !== 'cancelled';
            const showForceComplete = canForceComplete(campaign);
            const showCancel = canCancel(campaign);
            const showReactivate = canReactivate(campaign);
            
            return (
              <Card key={campaign.id} className={`glass-card ${needsWinner ? 'border-amber-500/50' : ''} ${campaign.status === 'cancelled' ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{campaign.title}</h3>
                        {getStatusBadge(campaign.status)}
                        {campaign.winner_id && (
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
                      {campaign.theme && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Theme: {campaign.theme}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          ${campaign.prize_amount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {campaign.submission_count} / {campaign.min_participants} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/campaign/${campaign.slug || campaign.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {campaign.status !== 'cancelled' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/campaigns/${campaign.id}/edit`}>
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
                          onClick={() => setForceCompleteCampaign(campaign)}
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
                          onClick={() => setCancelCampaign(campaign)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {showReactivate && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-green-500 text-green-500 hover:bg-green-500/10"
                          onClick={() => setReactivateCampaign(campaign)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reactivate
                        </Button>
                      )}
                      {needsWinner ? (
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild>
                          <Link to={`/admin/campaigns/${campaign.id}/winner`}>
                            <Crown className="h-4 w-4 mr-1" />
                            Select Winner
                          </Link>
                        </Button>
                      ) : campaign.status === 'completed' && !campaign.winner_id ? (
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild>
                          <Link to={`/admin/campaigns/${campaign.id}/winner`}>
                            <Crown className="h-4 w-4 mr-1" />
                            Select Winner
                          </Link>
                        </Button>
                      ) : campaign.status !== 'cancelled' ? (
                        <Button size="sm" asChild>
                          <Link to="/admin/submissions">
                            Review ({campaign.submission_count})
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
      <AlertDialog open={!!forceCompleteCampaign} onOpenChange={(open) => !open && setForceCompleteCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Complete Campaign?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will immediately end the campaign and move it to completion.</p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>No new submissions will be allowed</li>
                  <li>Winners can be selected</li>
                  <li>Prizes and payouts can proceed normally</li>
                </ul>
                {forceCompleteCampaign && forceCompleteCampaign.submission_count < forceCompleteCampaign.min_participants && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-amber-200 text-sm">
                    <strong>Note:</strong> This campaign has only {forceCompleteCampaign.submission_count} submissions, 
                    which is below the minimum requirement of {forceCompleteCampaign.min_participants}.
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
              Yes, Complete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Campaign Confirmation Dialog */}
      <AlertDialog open={!!cancelCampaign} onOpenChange={(open) => { if (!open) { setCancelCampaign(null); setNotifyParticipants(true); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Campaign?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will permanently cancel the campaign "{cancelCampaign?.title}".</p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>No new submissions will be allowed</li>
                  <li>No winner can be selected</li>
                  <li>No prizes will be awarded</li>
                  <li>The campaign will be marked as cancelled</li>
                </ul>
                {cancelCampaign && cancelCampaign.submission_count > 0 && (
                  <div className="bg-muted/50 border border-border rounded-md p-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This campaign has {cancelCampaign.submission_count} submission{cancelCampaign.submission_count !== 1 ? 's' : ''}.
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
              onClick={handleCancelCampaign}
              disabled={isCancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Yes, Cancel Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Campaign Confirmation Dialog */}
      <AlertDialog open={!!reactivateCampaign} onOpenChange={(open) => { if (!open) { setReactivateCampaign(null); setNotifyOnReactivate(true); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Campaign?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will restore the campaign "{reactivateCampaign?.title}" to active status.</p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>New submissions will be allowed</li>
                  <li>The campaign will appear as active to users</li>
                  <li>All existing submissions will be preserved</li>
                </ul>
                {reactivateCampaign && new Date(reactivateCampaign.end_date) <= new Date() && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-amber-200 text-sm">
                    <strong>Warning:</strong> The end date ({formatDate(reactivateCampaign.end_date)}) has already passed. 
                    Consider editing the campaign to extend the end date after reactivation.
                  </div>
                )}
                {reactivateCampaign && reactivateCampaign.submission_count > 0 && (
                  <div className="bg-muted/50 border border-border rounded-md p-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This campaign has {reactivateCampaign.submission_count} existing submission{reactivateCampaign.submission_count !== 1 ? 's' : ''}.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="notify-reactivate" 
                        checked={notifyOnReactivate}
                        onCheckedChange={(checked) => setNotifyOnReactivate(checked as boolean)}
                      />
                      <Label 
                        htmlFor="notify-reactivate" 
                        className="text-sm font-normal cursor-pointer"
                      >
                        Notify participants about reactivation
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateCampaign}
              disabled={isReactivating}
              className="bg-green-500 hover:bg-green-600"
            >
              {isReactivating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Yes, Reactivate Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCampaigns;