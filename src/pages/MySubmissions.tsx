import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalRefresh } from '@/hooks/useVisibilityRefresh';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

interface Submission {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  status: SubmissionStatus;
  admin_score: number | null;
  rejection_reason: string | null;
  created_at: string;
  contest_id: string;
  contest: {
    id: string;
    title: string;
    prize_amount: number;
    status: string;
  } | null;
}

const MySubmissions = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchSubmissions = useCallback(async (userId: string) => {
    try {
      const { data: subs, error } = await supabase
        .from('submissions')
        .select(
          [
            'id',
            'title',
            'description',
            'image_url',
            'status',
            'admin_score',
            'rejection_reason',
            'created_at',
            'contest_id',
          ].join(',')
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: 'Error loading submissions',
          description: error.message || 'Please try refreshing the page.',
          variant: 'destructive',
        });
        setSubmissions([]);
        return;
      }

      const submissionRows = (subs ?? []) as unknown as Array<
        Omit<Submission, 'contest'> & { contest: never }
      >;

      const contestIds = Array.from(
        new Set(submissionRows.map((s) => s.contest_id).filter(Boolean))
      );

      let contestsById = new Map<string, Submission['contest']>();

      if (contestIds.length > 0) {
        const { data: contests, error: contestError } = await supabase
          .from('contests')
          .select('id, title, prize_amount, status')
          .in('id', contestIds);

        if (contestError) {
          console.error('Error fetching contests for submissions:', contestError);
        } else {
          (contests ?? []).forEach((c) => {
            contestsById.set(c.id, c as any);
          });
        }
      }

      const merged: Submission[] = submissionRows.map((s) => ({
        ...(s as any),
        contest: contestsById.get(s.contest_id) ?? null,
      }));

      setSubmissions(merged);
    } catch (err) {
      console.error('Exception fetching submissions:', err);
      toast({
        title: 'Error loading submissions',
        description: 'Please try refreshing the page.',
        variant: 'destructive',
      });
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Wait for auth to finish loading before fetching
    if (authLoading) {
      console.log('MySubmissions: Auth still loading');
      return;
    }
    
    if (!user) {
      console.log('MySubmissions: No user after auth loaded');
      setIsLoading(false);
      return;
    }

    console.log('MySubmissions: Fetching submissions for:', user.id);
    setIsLoading(true);
    fetchSubmissions(user.id);

    // Real-time subscription for user's submissions
    const channel = supabase
      .channel('my-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
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
          
          fetchSubmissions(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSubmissions, toast]);

  // Listen for global refresh events (tab visibility, network reconnection)
  const handleGlobalRefresh = useCallback(() => {
    if (user) {
      fetchSubmissions(user.id);
    }
  }, [user, fetchSubmissions]);

  useGlobalRefresh(handleGlobalRefresh);

  const handleDelete = async (submissionId: string, imageUrl: string) => {
    setDeletingId(submissionId);
    try {
      // Extract file path from URL for storage deletion
      const urlParts = imageUrl.split('/submissions/');
      if (urlParts[1]) {
        const filePath = urlParts[1];
        await supabase.storage.from('submissions').remove([filePath]);
      }

      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: 'Submission deleted',
        description: 'Your submission has been removed.',
      });
      
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
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
    if (user) {
      await fetchSubmissions(user.id);
    }
  }, [user, fetchSubmissions]);

  const { pullDistance, isRefreshing, containerProps } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col" {...containerProps}>
      <Navbar />
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">My Submissions</h1>
            <p className="text-muted-foreground mt-1">
              Track all your contest entries and their status
            </p>
          </div>
          <Button asChild className="gradient-primary">
            <Link to="/contests">Enter New Contest</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <MySubmissionsSkeleton />
          ) : filteredSubmissions.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all'
                    ? "You haven't submitted any photos yet. Join a contest to get started!"
                    : `No ${activeTab} submissions found.`}
                </p>
                {activeTab === 'all' && (
                  <Button asChild>
                    <Link to="/contests">Browse Contests</Link>
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
                      Contest: {submission.contest?.title ?? 'Unknown contest'}
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
