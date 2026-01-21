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
  Trash2,
  Play,
  Video,
  Camera,
  Upload,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';

const MySubmissions = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [videoModalSubmission, setVideoModalSubmission] = useState<Submission | null>(null);
  
  // Thumbnail editing state
  const [thumbnailEditSubmission, setThumbnailEditSubmission] = useState<Submission | null>(null);
  const [thumbnailTime, setThumbnailTime] = useState<number>(0.5);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState<string | null>(null);
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isSavingThumbnail, setIsSavingThumbnail] = useState(false);

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

  // Open thumbnail edit modal
  const openThumbnailEditor = (submission: Submission) => {
    setThumbnailEditSubmission(submission);
    setNewThumbnailPreview(submission.video_thumbnail_url || submission.image_url);
    setNewThumbnailFile(null);
    setThumbnailTime(0.5);
  };

  // Generate thumbnail at specific time from video
  const generateThumbnailAtTime = useCallback((time: number) => {
    if (!thumbnailEditSubmission?.video_url) return;
    
    setIsGeneratingThumbnail(true);
    const video = document.createElement('video');
    video.src = thumbnailEditSubmission.video_url;
    video.crossOrigin = 'anonymous';
    
    video.onloadedmetadata = () => {
      const clampedTime = Math.min(time, video.duration - 0.1);
      video.currentTime = Math.max(0, clampedTime);
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
            setNewThumbnailFile(thumbnailFile);
            setNewThumbnailPreview(canvas.toDataURL('image/jpeg'));
          }
          setIsGeneratingThumbnail(false);
        }, 'image/jpeg', 0.9);
      } else {
        setIsGeneratingThumbnail(false);
      }
    };
    
    video.onerror = () => {
      setIsGeneratingThumbnail(false);
      toast({
        title: 'Failed to generate thumbnail',
        description: 'Could not extract frame from video.',
        variant: 'destructive',
      });
    };
  }, [thumbnailEditSubmission?.video_url, toast]);

  // Handle custom thumbnail upload
  const handleCustomThumbnailUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Thumbnail must be smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setNewThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [toast]);

  // Save new thumbnail
  const saveThumbnail = async () => {
    if (!thumbnailEditSubmission || !newThumbnailFile || !user) return;
    
    setIsSavingThumbnail(true);
    try {
      // Upload new thumbnail to storage
      const thumbFileName = `${user.id}/${thumbnailEditSubmission.campaign?.id || 'unknown'}/${Date.now()}-thumb.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(thumbFileName, newThumbnailFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(thumbFileName);

      // Update submission record
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ 
          video_thumbnail_url: publicUrl,
          image_url: publicUrl  // Also update image_url for display
        })
        .eq('id', thumbnailEditSubmission.id);

      if (updateError) throw updateError;

      toast({
        title: 'Thumbnail updated',
        description: 'Your video thumbnail has been saved.',
      });

      // Refresh submissions
      queryClient.invalidateQueries({ queryKey: ['my-submissions', user.id] });
      setThumbnailEditSubmission(null);
    } catch (error) {
      console.error('Error saving thumbnail:', error);
      toast({
        title: 'Failed to save thumbnail',
        description: 'Could not update the thumbnail. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingThumbnail(false);
    }
  };

  // Handle thumbnail time slider change
  const handleThumbnailTimeChange = useCallback((value: number[]) => {
    const time = value[0];
    setThumbnailTime(time);
    generateThumbnailAtTime(time);
  }, [generateThumbnailAtTime]);

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
    // Status filter
    let statusMatch = true;
    if (activeTab === 'pending') statusMatch = s.status === 'pending';
    else if (activeTab === 'approved') statusMatch = s.status === 'approved' || s.status === 'winner';
    else if (activeTab === 'rejected') statusMatch = s.status === 'rejected' || s.status === 'disqualified';
    
    // Media type filter
    let mediaMatch = true;
    if (mediaFilter === 'photos') mediaMatch = !s.video_url;
    else if (mediaFilter === 'videos') mediaMatch = !!s.video_url;
    
    return statusMatch && mediaMatch;
  });

  const photoCount = submissions.filter((s) => !s.video_url).length;
  const videoCount = submissions.filter((s) => !!s.video_url).length;

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

          {/* Media Type Filter */}
          {(photoCount > 0 && videoCount > 0) && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground mr-2">Media:</span>
              <Button
                variant={mediaFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaFilter('all')}
              >
                All ({submissions.length})
              </Button>
              <Button
                variant={mediaFilter === 'photos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaFilter('photos')}
                className="gap-1"
              >
                <Camera className="h-3 w-3" /> Photos ({photoCount})
              </Button>
              <Button
                variant={mediaFilter === 'videos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaFilter('videos')}
                className="gap-1"
              >
                <Video className="h-3 w-3" /> Videos ({videoCount})
              </Button>
            </div>
          )}
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
              {filteredSubmissions.map((submission) => {
                const isVideo = !!submission.video_url;
                const thumbnailUrl = isVideo 
                  ? (submission.video_thumbnail_url || submission.image_url) 
                  : submission.image_url;
                
                return (
                <Card key={submission.id} className="glass-card overflow-hidden group">
                  <div 
                    className={`relative aspect-video overflow-hidden ${isVideo ? 'cursor-pointer' : ''}`}
                    onClick={() => isVideo && setVideoModalSubmission(submission)}
                  >
                    {isVideo ? (
                      <div className="relative w-full h-full">
                        <img
                          src={thumbnailUrl}
                          alt={submission.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
                          </div>
                        </div>
                        {submission.video_duration_seconds && (
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                            {Math.floor(submission.video_duration_seconds / 60)}:{String(Math.floor(submission.video_duration_seconds % 60)).padStart(2, '0')}
                          </div>
                        )}
                        <Badge variant="secondary" className="absolute top-3 left-3 gap-1">
                          <Video className="h-3 w-3" /> Video
                        </Badge>
                      </div>
                    ) : (
                      <img
                        src={submission.image_url}
                        alt={submission.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(submission.status)}
                    </div>
                    {submission.status === 'winner' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-accent/30 to-transparent pointer-events-none" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{submission.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Campaign: {submission.campaign?.title ?? 'Unknown campaign'}
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
                          <>
                            {/* Edit Thumbnail Button (video only) */}
                            {isVideo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openThumbnailEditor(submission);
                                }}
                                title="Edit thumbnail"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
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
                          </>
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
              );
              })}
            </div>
          )}
        </Tabs>

        {/* Video Player Modal */}
        <Dialog open={!!videoModalSubmission} onOpenChange={(open) => !open && setVideoModalSubmission(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {videoModalSubmission?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2">
              {videoModalSubmission?.video_url && (
                <video
                  src={videoModalSubmission.video_url}
                  controls
                  autoPlay
                  className="w-full rounded-lg max-h-[70vh]"
                >
                  Your browser does not support video playback.
                </video>
              )}
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Campaign: {videoModalSubmission?.campaign?.title ?? 'Unknown'}
                  </p>
                  {videoModalSubmission?.video_duration_seconds && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {Math.floor(videoModalSubmission.video_duration_seconds / 60)}:{String(Math.floor(videoModalSubmission.video_duration_seconds % 60)).padStart(2, '0')}
                    </p>
                  )}
                </div>
                {videoModalSubmission && getStatusBadge(videoModalSubmission.status)}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Thumbnail Edit Modal */}
        <Dialog open={!!thumbnailEditSubmission} onOpenChange={(open) => !open && setThumbnailEditSubmission(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Edit Video Thumbnail
              </DialogTitle>
            </DialogHeader>
            {thumbnailEditSubmission && (
              <div className="space-y-6">
                {/* Current Thumbnail Preview */}
                <div className="space-y-2">
                  <Label>Thumbnail Preview</Label>
                  <div className="relative flex justify-center bg-secondary/50 rounded-lg p-4">
                    {newThumbnailPreview ? (
                      <img 
                        src={newThumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="max-h-48 rounded object-contain"
                      />
                    ) : (
                      <div className="h-32 w-48 flex items-center justify-center bg-muted rounded">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {isGeneratingThumbnail && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Frame Selector */}
                {thumbnailEditSubmission.video_duration_seconds && thumbnailEditSubmission.video_duration_seconds > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Select frame from video</Label>
                      <span className="text-sm text-muted-foreground">
                        {thumbnailTime.toFixed(1)}s / {thumbnailEditSubmission.video_duration_seconds}s
                      </span>
                    </div>
                    <Slider
                      value={[thumbnailTime]}
                      onValueChange={handleThumbnailTimeChange}
                      max={Math.max(thumbnailEditSubmission.video_duration_seconds - 0.1, 0.1)}
                      min={0}
                      step={0.1}
                      className="w-full"
                      disabled={isGeneratingThumbnail}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateThumbnailAtTime(thumbnailTime)}
                      disabled={isGeneratingThumbnail}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isGeneratingThumbnail ? 'animate-spin' : ''}`} />
                      Generate from selected frame
                    </Button>
                  </div>
                )}

                {/* Custom Upload */}
                <div className="space-y-2">
                  <Label>Or upload a custom thumbnail</Label>
                  <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload image (JPEG, PNG, WebP, max 5MB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCustomThumbnailUpload}
                    />
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setThumbnailEditSubmission(null)}
                    disabled={isSavingThumbnail}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveThumbnail}
                    disabled={!newThumbnailFile || isSavingThumbnail}
                    className="gap-2"
                  >
                    {isSavingThumbnail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Thumbnail'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default MySubmissions;
