import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Loader2,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  Star,
  Eye,
  Trash2,
  Pencil
} from 'lucide-react';
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
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  contest: {
    id: string;
    title: string;
    prize_amount: number;
    prize_currency: string;
    status: string;
    end_date: string;
  };
}

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          description,
          image_url,
          status,
          admin_score,
          admin_notes,
          rejection_reason,
          created_at,
          updated_at,
          reviewed_at,
          contest:contests(id, title, prize_amount, prize_currency, status, end_date)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching submission:', error);
        navigate('/submissions');
        return;
      }

      if (!data) {
        navigate('/submissions');
        return;
      }

      setSubmission(data as unknown as Submission);
      setIsLoading(false);
    };

    fetchSubmission();

    // Real-time subscription for this submission
    const channel = supabase
      .channel(`submission-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Submission updated:', payload);
          fetchSubmission();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, navigate]);

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1 text-base px-4 py-2"><Clock className="h-4 w-4" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-success gap-1 text-base px-4 py-2"><CheckCircle className="h-4 w-4" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1 text-base px-4 py-2"><XCircle className="h-4 w-4" />Rejected</Badge>;
      case 'winner':
        return <Badge className="bg-accent gap-1 text-base px-4 py-2"><Trophy className="h-4 w-4" />Winner!</Badge>;
      case 'disqualified':
        return <Badge variant="destructive" className="gap-1 text-base px-4 py-2"><AlertCircle className="h-4 w-4" />Disqualified</Badge>;
      default:
        return null;
    }
  };

  const getStatusTimeline = () => {
    if (!submission) return [];

    const timeline = [
      {
        label: 'Submitted',
        date: submission.created_at,
        completed: true,
        icon: ImageIcon
      }
    ];

    if (submission.reviewed_at) {
      timeline.push({
        label: submission.status === 'approved' || submission.status === 'winner' ? 'Approved' : 'Reviewed',
        date: submission.reviewed_at,
        completed: true,
        icon: submission.status === 'approved' || submission.status === 'winner' ? CheckCircle : XCircle
      });
    }

    if (submission.status === 'winner') {
      timeline.push({
        label: 'Selected as Winner',
        date: submission.updated_at,
        completed: true,
        icon: Trophy
      });
    }

    if (submission.status === 'pending') {
      timeline.push({
        label: 'Awaiting Review',
        date: null,
        completed: false,
        icon: Clock
      });
    }

    return timeline;
  };

  const handleDelete = async () => {
    if (!submission) return;
    
    setIsDeleting(true);
    try {
      // Extract file path from URL for storage deletion
      const urlParts = submission.image_url.split('/submissions/');
      if (urlParts[1]) {
        const filePath = urlParts[1];
        await supabase.storage.from('submissions').remove([filePath]);
      }

      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: 'Submission deleted',
        description: 'Your submission has been removed.',
      });
      
      navigate('/submissions');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: 'Delete failed',
        description: 'Could not delete submission. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const openEditDialog = () => {
    if (!submission) return;
    setEditTitle(submission.title);
    setEditDescription(submission.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!submission) return;
    
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your submission.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedTitle.length > 100) {
      toast({
        title: 'Title too long',
        description: 'Title must be less than 100 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          title: trimmedTitle,
          description: editDescription.trim() || null,
        })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmission({
        ...submission,
        title: trimmedTitle,
        description: editDescription.trim() || null,
      });

      toast({
        title: 'Changes saved',
        description: 'Your submission has been updated.',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update submission. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/submissions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
          
          {submission.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={openEditDialog}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Submission</DialogTitle>
                    <DialogDescription>
                      Update your submission title and description before admin review.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        maxLength={100}
                        placeholder="Enter submission title"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {editTitle.length}/100
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description (Optional)</Label>
                      <Textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        maxLength={500}
                        placeholder="Tell us about your photo..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {editDescription.length}/500
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
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
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Card */}
            <Card className="glass-card overflow-hidden">
              <div className="relative">
                <img
                  src={submission.image_url}
                  alt={submission.title}
                  className="w-full max-h-[600px] object-contain bg-secondary"
                />
                <div className="absolute top-4 right-4">
                  {getStatusBadge(submission.status)}
                </div>
                {submission.status === 'winner' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent pointer-events-none" />
                )}
              </div>
              <CardContent className="p-6">
                <h1 className="text-2xl font-display font-bold mb-2">{submission.title}</h1>
                {submission.description && (
                  <p className="text-muted-foreground">{submission.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Admin Feedback */}
            {(submission.admin_notes || submission.rejection_reason || submission.admin_score !== null) && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Admin Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.admin_score !== null && (
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-xl font-bold text-primary">{submission.admin_score}/100</p>
                      </div>
                    </div>
                  )}

                  {submission.rejection_reason && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                      <p className="text-sm">{submission.rejection_reason}</p>
                    </div>
                  )}

                  {submission.admin_notes && (
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{submission.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contest Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Contest Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contest</p>
                  <p className="font-medium">{submission.contest.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prize</p>
                  <p className="font-bold text-primary text-lg">
                    {submission.contest.prize_currency} {submission.contest.prize_amount.toLocaleString()}
                  </p>
                </div>
                <Separator />
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/contest/${submission.contest.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Contest
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getStatusTimeline().map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${!item.completed && 'text-muted-foreground'}`}>
                          {item.label}
                        </p>
                        {item.date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Submission Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Submission Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                </div>
                {submission.reviewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviewed</span>
                    <span>{new Date(submission.reviewed_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{submission.status}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmissionDetail;
