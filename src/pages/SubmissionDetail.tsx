import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSubmissionDetailQuery, SubmissionDetail as SubmissionDetailType } from '@/hooks/useSubmissionDetailQuery';

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
import ErrorState from '@/components/ErrorState';
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
  Pencil,
  Upload,
  X,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageCropper from '@/components/ImageCropper';
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

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { 
    data: submission, 
    isLoading, 
    isError,
    refetch 
  } = useSubmissionDetailQuery(id, user?.id);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [rawPhotoFile, setRawPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Local state for submission data (for optimistic updates)
  const [localSubmission, setLocalSubmission] = useState<SubmissionDetailType | null>(null);

  // Sync local state with query data
  useEffect(() => {
    if (submission) {
      setLocalSubmission(submission);
    }
  }, [submission]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!id) return;

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
        () => {
          queryClient.invalidateQueries({ queryKey: ['submission-detail', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  // Redirect if no submission found
  useEffect(() => {
    if (!isLoading && !submission && id) {
      navigate('/submissions');
    }
  }, [isLoading, submission, id, navigate]);

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
    if (!localSubmission) return [];

    const timeline = [
      {
        label: 'Submitted',
        date: localSubmission.created_at,
        completed: true,
        icon: ImageIcon
      }
    ];

    if (localSubmission.reviewed_at) {
      timeline.push({
        label: localSubmission.status === 'approved' || localSubmission.status === 'winner' ? 'Approved' : 'Reviewed',
        date: localSubmission.reviewed_at,
        completed: true,
        icon: localSubmission.status === 'approved' || localSubmission.status === 'winner' ? CheckCircle : XCircle
      });
    }

    if (localSubmission.status === 'winner') {
      timeline.push({
        label: 'Selected as Winner',
        date: localSubmission.updated_at,
        completed: true,
        icon: Trophy
      });
    }

    if (localSubmission.status === 'pending') {
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
    if (!localSubmission) return;
    
    setIsDeleting(true);
    try {
      // Extract file path from URL for storage deletion
      const urlParts = localSubmission.image_url.split('/submissions/');
      if (urlParts[1]) {
        const filePath = urlParts[1];
        await supabase.storage.from('submissions').remove([filePath]);
      }

      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', localSubmission.id);

      if (error) throw error;

      toast({
        title: 'Submission deleted',
        description: 'Your submission has been removed.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
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
    if (!localSubmission) return;
    setEditTitle(localSubmission.title);
    setEditDescription(localSubmission.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!localSubmission) return;
    
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
        .eq('id', localSubmission.id);

      if (error) throw error;

      setLocalSubmission({
        ...localSubmission,
        title: trimmedTitle,
        description: editDescription.trim() || null,
      });

      toast({
        title: 'Changes saved',
        description: 'Your submission has been updated.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['submission-detail', id] });
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

  const handleNewPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (20MB max for raw, will be compressed)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 20MB.',
        variant: 'destructive',
      });
      return;
    }

    // Open cropper with the raw file
    setRawPhotoFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedFile: File) => {
    setNewPhotoFile(croppedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
    setRawPhotoFile(null);
    setShowCropper(false);
    
    toast({
      title: 'Image optimized',
      description: `Compressed to ${(croppedFile.size / 1024 / 1024).toFixed(2)} MB`,
    });
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setRawPhotoFile(null);
  };

  const handleCancelImageReplace = () => {
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    setIsReplacingImage(false);
  };

  const handleReplaceImage = async () => {
    if (!localSubmission || !newPhotoFile || !user) return;

    setIsUploadingImage(true);
    try {
      // Upload new image
      const fileExt = newPhotoFile.name.split('.').pop();
      const fileName = `${user.id}/${localSubmission.contest.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, newPhotoFile);

      if (uploadError) throw uploadError;

      // Get new public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      // Delete old image from storage
      const oldUrlParts = localSubmission.image_url.split('/submissions/');
      if (oldUrlParts[1]) {
        const oldFilePath = oldUrlParts[1];
        await supabase.storage.from('submissions').remove([oldFilePath]);
      }

      // Update submission with new image URL
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ image_url: publicUrl })
        .eq('id', localSubmission.id);

      if (updateError) throw updateError;

      setLocalSubmission({
        ...localSubmission,
        image_url: publicUrl,
      });

      toast({
        title: 'Photo replaced',
        description: 'Your submission photo has been updated.',
      });

      queryClient.invalidateQueries({ queryKey: ['submission-detail', id] });
      handleCancelImageReplace();
    } catch (error) {
      console.error('Error replacing image:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not replace photo. Please try again.',
        variant: 'destructive',
      });
    }
    setIsUploadingImage(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <ErrorState 
            title="Failed to load submission" 
            message="Could not load submission data." 
            onRetry={refetch} 
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (!localSubmission) {
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
          
          {localSubmission.status === 'pending' && (
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
                      This will permanently delete your submission "{localSubmission.title}". This action cannot be undone.
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
                {isReplacingImage && newPhotoPreview ? (
                  <img
                    src={newPhotoPreview}
                    alt="New photo preview"
                    className="w-full max-h-[600px] object-contain bg-secondary"
                  />
                ) : (
                  <img
                    src={localSubmission.image_url}
                    alt={localSubmission.title}
                    className="w-full max-h-[600px] object-contain bg-secondary"
                  />
                )}
                <div className="absolute top-4 right-4">
                  {getStatusBadge(localSubmission.status)}
                </div>
                {localSubmission.status === 'winner' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent pointer-events-none" />
                )}
                
                {/* Replace image button for pending submissions */}
                {localSubmission.status === 'pending' && !isReplacingImage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-4 right-4"
                    onClick={() => setIsReplacingImage(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Replace Photo
                  </Button>
                )}
              </div>
              
              {/* Image replacement UI */}
              {localSubmission.status === 'pending' && isReplacingImage && (
                <div className="p-4 border-t border-border bg-secondary/30">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {newPhotoPreview ? 'New photo selected' : 'Select a new photo'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelImageReplace}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                    
                    {!newPhotoPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload a new photo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPEG, PNG, or WebP (max 20MB) - Will be cropped &amp; compressed
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleNewPhotoSelect}
                        />
                      </label>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setNewPhotoFile(null);
                            setNewPhotoPreview(null);
                          }}
                        >
                          Choose Different
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleReplaceImage}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Confirm Replace
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <h1 className="text-2xl font-display font-bold mb-2">{localSubmission.title}</h1>
                {localSubmission.description && (
                  <p className="text-muted-foreground">{localSubmission.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Admin Feedback */}
            {(localSubmission.admin_notes || localSubmission.rejection_reason || localSubmission.admin_score !== null) && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Admin Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {localSubmission.admin_score !== null && (
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-xl font-bold text-primary">{localSubmission.admin_score}/100</p>
                      </div>
                    </div>
                  )}

                  {localSubmission.rejection_reason && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                      <p className="text-sm">{localSubmission.rejection_reason}</p>
                    </div>
                  )}

                  {localSubmission.admin_notes && (
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{localSubmission.admin_notes}</p>
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
                  <p className="font-medium">{localSubmission.contest.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prize</p>
                  <p className="font-bold text-primary text-lg">
                    ${localSubmission.contest.prize_amount.toLocaleString()}
                  </p>
                </div>
                <Separator />
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/contest/${localSubmission.contest.slug || localSubmission.contest.id}`}>
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
                  <span>{new Date(localSubmission.created_at).toLocaleDateString()}</span>
                </div>
                {localSubmission.reviewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviewed</span>
                    <span>{new Date(localSubmission.reviewed_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{localSubmission.status}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Image Cropper Modal */}
      {rawPhotoFile && (
        <ImageCropper
          file={rawPhotoFile}
          isOpen={showCropper}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
          maxWidth={1920}
          maxHeight={1920}
          quality={0.85}
        />
      )}
    </div>
  );
};

export default SubmissionDetail;
