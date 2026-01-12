import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMySubmissionsQuery, useDeleteSubmission, Submission } from '@/hooks/useMySubmissionsQuery';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorState from '@/components/ErrorState';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { MySubmissionsSkeleton } from '@/components/skeletons/SubmissionSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Image as ImageIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Loader2,
  AlertCircle,
  Eye,
  Trash2
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';

const MySubmissions = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { data: submissions = [], isLoading, isError, refetch } = useMySubmissionsQuery(user?.id);
  const deleteSubmission = useDeleteSubmission();

  // Real-time subscription for user's submissions
  useEffect(() => {
    if (!user?.id) return;

    let isSubscribed = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`my-submissions-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'submissions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (!isSubscribed) return;
            console.log('Submission change:', payload);
            
            if (payload.eventType === 'INSERT') {
              toast({
                title: 'New submission added',
                description: 'Your submission has been recorded.',
              });
            } else if (payload.eventType === 'UPDATE') {
              const newStatus = (payload.new as any).status;
              const oldStatus = (payload.old as any).status;
              if (newStatus !== oldStatus) {
                toast({
                  title: 'Submission status updated',
                  description: `Your submission status changed to ${newStatus}.`,
                });
              }
            }
            
            queryClient.invalidateQueries({ queryKey: ['my-submissions', user.id] });
          }
        )
        .subscribe((status) => {
          console.log('My submissions subscription status:', status);
        });
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, toast, queryClient]);

  const handleDelete = async (submissionId: string, imageUrl: string) => {
    setDeletingId(submissionId);
    try {
      await deleteSubmission.mutateAsync({ submissionId, imageUrl });
      toast({
        title: 'Submission deleted',
        description: 'Your submission has been removed.',
      });
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: 'Delete failed',
        description: 'Could not delete submission. Please try again.',
        variant: 'destructive',
      });
    }
    setDeletingId(null);
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-success gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      case 'winner':
        return <Badge className="bg-accent gap-1"><Trophy className="h-3 w-3" />Winner!</Badge>;
      case 'disqualified':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Disqualified</Badge>;
      default:
        return null;
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'approved') return s.status === 'approved' || s.status === 'winner';
    if (activeTab === 'rejected') return s.status === 'rejected' || s.status === 'disqualified';
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved' || s.status === 'winner').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected' || s.status === 'disqualified').length;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { pullDistance, isRefreshing, containerProps } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const showLoading = authLoading || isLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col" {...containerProps}>
      <Navbar />
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">My Submissions</h1>
            <p className="text-muted-foreground mt-1">
              Track all your campaign entries and their status
            </p>
          </div>
          <Button asChild className="gradient-primary">
            <Link to="/campaigns">Enter New Campaign</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          </TabsList>

          {showLoading ? (
            <MySubmissionsSkeleton />
          ) : isError ? (
            <ErrorState
              title="Failed to Load Submissions"
              message="We couldn't load your submissions. Please try again."
              onRetry={() => refetch()}
            />
          ) : filteredSubmissions.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all'
                    ? "You haven't submitted any photos yet. Join a campaign to get started!"
                    : `No ${activeTab} submissions found.`}
                </p>
                {activeTab === 'all' && (
                  <Button asChild>
                    <Link to="/campaigns">Browse Campaigns</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="glass-card overflow-hidden group">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={submission.image_url}
                      alt={submission.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(submission.status)}
                    </div>
                    {submission.status === 'winner' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-accent/30 to-transparent" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{submission.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Campaign: {submission.contest?.title ?? 'Unknown campaign'}
                    </p>
                    
                    {submission.admin_score !== null && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-muted-foreground">Score:</span>
                        <span className="font-semibold text-primary">{submission.admin_score}/100</span>
                      </div>
                    )}

                    {submission.rejection_reason && (
                      <div className="p-2 bg-destructive/10 rounded-lg mb-3">
                        <p className="text-xs text-destructive">{submission.rejection_reason}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        {submission.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive"
                                disabled={deletingId === submission.id}
                              >
                                {deletingId === submission.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete your submission "{submission.title}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(submission.id, submission.image_url)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/submission/${submission.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default MySubmissions;
