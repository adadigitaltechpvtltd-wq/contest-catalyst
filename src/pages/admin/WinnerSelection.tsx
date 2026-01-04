import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useWinnerSelectionQuery, WinnerSubmission } from '@/hooks/useWinnerSelectionQuery';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ErrorState from '@/components/ErrorState';
import {
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  Loader2,
  Crown,
  Camera,
  User,
  CheckCircle,
} from 'lucide-react';
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

const WinnerSelection = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useWinnerSelectionQuery(contestId);
  const contest = data?.campaign ?? null;
  const submissions = data?.submissions ?? [];

  const [selectedSubmission, setSelectedSubmission] = useState<WinnerSubmission | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectWinner = (submission: WinnerSubmission) => {
    setSelectedSubmission(submission);
    setIsConfirmOpen(true);
  };

  const confirmWinner = async () => {
    if (!selectedSubmission || !contest || !user) return;

    setIsSubmitting(true);

    try {
      // Update submission status to winner
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({
          status: 'winner',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedSubmission.id);

      if (submissionError) throw submissionError;

      // Update contest with winner info
      const { error: contestError } = await supabase
        .from('contests')
        .update({
          winner_id: selectedSubmission.profile?.id,
          winning_submission_id: selectedSubmission.id,
          status: 'completed',
        })
        .eq('id', contest.id);

      if (contestError) throw contestError;

      // Create wallet transaction for prize (pending status)
      const { error: walletError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: selectedSubmission.profile?.id,
          contest_id: contest.id,
          submission_id: selectedSubmission.id,
          type: 'prize',
          amount: contest.prize_amount,
          currency: contest.prize_currency || 'USD',
          status: 'pending',
          notes: `Prize for winning "${contest.title}"`,
        });

      if (walletError) {
        console.error('Error creating wallet transaction:', walletError);
        // Don't throw - winner is selected, wallet transaction is secondary
      }

      // Create notification for the winner
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.profile?.id,
        type: 'success',
        title: '🏆 Congratulations! You Won!',
        message: `You've won the "${contest.title}" campaign! Prize: $${contest.prize_amount}. Your earnings will be transferred soon.`,
        link: `/campaign/general/${contest.id}`,
      });

      toast({
        title: 'Winner Selected!',
        description: `${selectedSubmission.profile?.full_name || 'Anonymous'} has been selected as the winner. A pending prize of $${contest.prize_amount} has been added to their wallet.`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['winner-selection', contestId] });
    } catch (error: any) {
      console.error('Error selecting winner:', error);
      toast({
        title: 'Failed to select winner',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-transparent';
      case 2:
        return 'border-gray-400/50 bg-gradient-to-r from-gray-400/10 to-transparent';
      case 3:
        return 'border-amber-600/50 bg-gradient-to-r from-amber-600/10 to-transparent';
      default:
        return 'border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState 
        title="Failed to load data" 
        message="Could not load campaign data." 
        onRetry={refetch} 
      />
    );
  }

  if (!contest) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/campaigns')}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const hasWinner = contest.winning_submission_id !== null;
  const isEnded = new Date(contest.end_date) <= new Date();

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/campaigns')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">Campaign Winner Selection</h1>
          <p className="text-muted-foreground">{contest.title}</p>
        </div>
        {hasWinner && (
          <Badge className="bg-success text-lg px-4 py-1">
            <Trophy className="h-4 w-4 mr-2" />
            Winner Selected
          </Badge>
        )}
      </div>

      {/* Contest Info */}
      <Card className="glass-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Prize</p>
              <p className="text-2xl font-bold text-primary">
                ${contest.prize_amount}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={isEnded ? 'secondary' : 'default'}>
                {isEnded ? 'Ended' : 'Active'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved Submissions</p>
              <p className="text-xl font-semibold">{submissions.length}</p>
            </div>
            {contest.theme && (
              <div>
                <p className="text-sm text-muted-foreground">Theme</p>
                <p className="font-medium">{contest.theme}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warning if campaign is still active */}
      {!isEnded && (
        <Card className="border-amber-500/50 bg-amber-500/10 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="text-amber-200">
              This campaign is still active. You can select a winner, but it's recommended to wait until the campaign ends.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submissions Ranked List */}
      {submissions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Approved Submissions</h3>
            <p className="text-muted-foreground mb-6">
              Approve submissions first before selecting a winner.
            </p>
            <Button asChild>
              <Link to="/admin/submissions">Review Submissions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Rankings by Combined Score</h2>
            <p className="text-sm text-muted-foreground">
              Click "Select as Winner" to pick the winner
            </p>
          </div>

          {submissions.map((submission, index) => {
            const rank = index + 1;
            const isWinner = submission.status === 'winner';

            return (
              <Card
                key={submission.id}
                className={`overflow-hidden transition-all ${getRankStyle(rank)} ${
                  isWinner ? 'ring-2 ring-yellow-500' : ''
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Rank */}
                    <div className="w-16 flex items-center justify-center bg-muted/30 border-r border-border">
                      {isWinner ? (
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      ) : (
                        getRankIcon(rank)
                      )}
                    </div>

                    {/* Image */}
                    <div className="w-32 h-24 flex-shrink-0">
                      <img
                        src={submission.image_url}
                        alt={submission.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{submission.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            {submission.profile?.full_name || 'Anonymous'}
                          </div>
                        </div>
                        {isWinner && (
                          <Badge className="bg-yellow-500 text-black">
                            <Crown className="h-3 w-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-4 px-4 border-l border-border">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Combined</p>
                        <p className="text-lg font-bold text-primary">
                          {submission.combined_score?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">System</p>
                        <p className="text-sm font-medium">
                          {submission.system_score?.toFixed(0) || '-'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Admin</p>
                        <p className="text-sm font-medium">
                          {submission.admin_score?.toFixed(0) || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center px-4 border-l border-border">
                      {isWinner ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Selected</span>
                        </div>
                      ) : hasWinner ? (
                        <Button variant="ghost" size="sm" disabled>
                          Winner Chosen
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gradient-primary"
                          onClick={() => handleSelectWinner(submission)}
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Select as Winner
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Winner Selection</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to select <strong>{selectedSubmission?.profile?.full_name || 'Anonymous'}</strong> as the winner of "{contest.title}".
              <br /><br />
              This will:
              <ul className="list-disc ml-6 mt-2">
                <li>Mark this submission as the winner</li>
                <li>Update the campaign status to "Completed"</li>
                <li>Add <strong>${contest.prize_amount}</strong> to winner's wallet (pending payout)</li>
                <li>Notify the winner</li>
                <li>Update the leaderboard</li>
              </ul>
              <br />
              This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmWinner}
              disabled={isSubmitting}
              className="bg-primary"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Confirm Winner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WinnerSelection;
