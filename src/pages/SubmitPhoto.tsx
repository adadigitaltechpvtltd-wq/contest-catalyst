import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorMapping';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { 
  Upload, 
  Camera, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  X,
  Image as ImageIcon,
  Clock,
  Crop,
  Images,
  ExternalLink
} from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';

interface Contest {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  prize_amount: number;
  rules: string[] | null;
  end_date: string;
}

interface PreviousSubmission {
  id: string;
  title: string;
  image_url: string;
  status: string;
  created_at: string;
  contest: {
    title: string;
  } | null;
}

const SubmitPhoto = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [rawPhotoFile, setRawPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [originalityConfirmed, setOriginalityConfirmed] = useState(false);
  const [noAiConfirmed, setNoAiConfirmed] = useState(false);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);

  // Check if user already submitted
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Previous submissions gallery
  const [previousSubmissions, setPreviousSubmissions] = useState<PreviousSubmission[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Time remaining state
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  const calculateTimeRemaining = useCallback((endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    
    if (end <= now) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    
    const days = differenceInDays(end, now);
    const hours = differenceInHours(end, now) % 24;
    const minutes = differenceInMinutes(end, now) % 60;
    const seconds = differenceInSeconds(end, now) % 60;
    
    return { days, hours, minutes, seconds, isExpired: false };
  }, []);

  useEffect(() => {
    const fetchContest = async () => {
      if (!contestId) {
        setIsLoading(false);
        return;
      }

      // Wait for auth to load before checking user
      if (authLoading) {
        console.log('SubmitPhoto: Auth still loading...');
        return;
      }

      console.log('SubmitPhoto: Fetching contest:', contestId, 'User:', user?.id);

      try {
        const { data, error } = await supabase
          .from('contests')
          .select('id, title, description, theme, prize_amount, rules, end_date')
          .eq('id', contestId)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('Error fetching contest:', error);
          toast({
            title: 'Error loading contest',
            description: 'Please try again later.',
            variant: 'destructive',
          });
          navigate('/contests');
          return;
        }

        if (!data) {
          toast({
            title: 'Contest not found',
            description: 'This contest may have ended or does not exist.',
            variant: 'destructive',
          });
          navigate('/contests');
          return;
        }

        setContest(data);
        setTimeRemaining(calculateTimeRemaining(data.end_date));

        // Check if user already submitted
        if (user) {
          const { data: submission, error: subError } = await supabase
            .from('submissions')
            .select('id')
            .eq('contest_id', contestId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!subError && submission) {
            setHasSubmitted(true);
          }
        }
      } catch (err) {
        console.error('Exception in fetchContest:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContest();
  }, [contestId, user, authLoading, navigate, toast, calculateTimeRemaining]);

  // Fetch previous submissions
  useEffect(() => {
    const fetchPreviousSubmissions = async () => {
      if (authLoading || !user) return;
      
      setIsLoadingGallery(true);
      
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          image_url,
          status,
          created_at,
          contest:contests(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);

      if (!error && data) {
        setPreviousSubmissions(data as PreviousSubmission[]);
      }
      
      setIsLoadingGallery(false);
    };

    fetchPreviousSubmissions();
  }, [user, authLoading]);

  // Update countdown every second
  useEffect(() => {
    if (!contest?.end_date) return;

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(contest.end_date));
    }, 1000);

    return () => clearInterval(interval);
  }, [contest?.end_date, calculateTimeRemaining]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [toast]);

  const handleCropComplete = useCallback((croppedFile: File) => {
    setPhotoFile(croppedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
    setRawPhotoFile(null);
    
    toast({
      title: 'Image optimized',
      description: `Compressed to ${(croppedFile.size / 1024 / 1024).toFixed(2)} MB`,
    });
  }, [toast]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setRawPhotoFile(null);
  }, []);

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !contest || !photoFile) return;

    if (!originalityConfirmed || !noAiConfirmed || !ownershipConfirmed) {
      toast({
        title: 'Please confirm all declarations',
        description: 'You must confirm that your photo is original and not AI-generated.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image to storage
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${contest.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      // Create submission
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          contest_id: contest.id,
          user_id: user.id,
          title,
          description,
          image_url: publicUrl,
          originality_confirmed: true,
        });

      if (submissionError) throw submissionError;

      toast({
        title: 'Submission successful!',
        description: 'Your photo has been submitted for review.',
      });

      navigate('/submissions');
    } catch (error: unknown) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Card className="glass-card max-w-md w-full text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Already Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                You have already submitted a photo for this contest.
              </p>
              <Button asChild>
                <a href="/submissions">View My Submissions</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // If contest deadline passed
  if (timeRemaining?.isExpired) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Card className="glass-card max-w-md w-full text-center">
            <CardContent className="p-8">
              <Clock className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Submissions Closed</h2>
              <p className="text-muted-foreground mb-6">
                The deadline for this contest has passed.
              </p>
              <Button asChild>
                <a href="/contests">Browse Other Contests</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">
              Submit Your Photo
            </h1>
            <p className="text-muted-foreground">
              Contest: <span className="text-foreground font-medium">{contest?.title}</span>
            </p>
            
            {/* Countdown Timer */}
            {timeRemaining && !timeRemaining.isExpired && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Time left:{' '}
                  <span className="text-primary">
                    {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                    {timeRemaining.hours.toString().padStart(2, '0')}:
                    {timeRemaining.minutes.toString().padStart(2, '0')}:
                    {timeRemaining.seconds.toString().padStart(2, '0')}
                  </span>
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="glass-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photo Upload
                </CardTitle>
                <CardDescription>
                  Upload a high-quality photo that you personally captured
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo Upload */}
                <div>
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full rounded-lg max-h-96 object-contain bg-secondary"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => {
                            // Re-open cropper with current file
                            if (photoFile) {
                              setRawPhotoFile(photoFile);
                              setShowCropper(true);
                            }
                          }}
                        >
                          <Crop className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={handleRemovePhoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {photoFile && (
                        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs">
                          {(photoFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPEG, PNG, or WebP (max 20MB) - Will be cropped &amp; compressed
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Photo Title</Label>
                  <Input
                    id="title"
                    placeholder="Give your photo a creative title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your photo, the story behind it, or the techniques used..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Originality Declaration */}
            <Card className="glass-card mb-6 border-amber-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                  Originality Declaration
                </CardTitle>
                <CardDescription>
                  Please confirm the following before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="originality"
                    checked={originalityConfirmed}
                    onCheckedChange={(checked) => setOriginalityConfirmed(checked as boolean)}
                  />
                  <Label htmlFor="originality" className="text-sm leading-relaxed">
                    I confirm that this photo is an <strong>original work</strong> that I personally captured with a camera or smartphone.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="no-ai"
                    checked={noAiConfirmed}
                    onCheckedChange={(checked) => setNoAiConfirmed(checked as boolean)}
                  />
                  <Label htmlFor="no-ai" className="text-sm leading-relaxed">
                    I confirm that this photo is <strong>NOT AI-generated</strong>, stock imagery, or copied from the internet.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="ownership"
                    checked={ownershipConfirmed}
                    onCheckedChange={(checked) => setOwnershipConfirmed(checked as boolean)}
                  />
                  <Label htmlFor="ownership" className="text-sm leading-relaxed">
                    I own all rights to this photo and grant Gaal <strong>display rights only</strong> for contest purposes.
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground mt-4 p-3 bg-secondary/50 rounded-lg">
                  <strong>Note:</strong> All submissions are subject to review. Violations may result in disqualification and account suspension. Our AI detection is best-effort only; final decisions are made by human reviewers.
                </p>
              </CardContent>
            </Card>

            {/* Contest Rules */}
            {contest?.rules && contest.rules.length > 0 && (
              <Card className="glass-card mb-6">
                <CardHeader>
                  <CardTitle>Contest Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {contest.rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Previous Submissions Gallery */}
            {previousSubmissions.length > 0 && (
              <Card className="glass-card mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Images className="h-5 w-5" />
                    Your Previous Submissions
                  </CardTitle>
                  <CardDescription>
                    Photos you've submitted to other contests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingGallery ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {previousSubmissions.map((submission) => (
                        <a
                          key={submission.id}
                          href={`/submissions/${submission.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
                        >
                          <img
                            src={submission.image_url}
                            alt={submission.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-white text-xs font-medium truncate">
                                {submission.title}
                              </p>
                              <p className="text-white/70 text-[10px] truncate">
                                {submission.contest?.title}
                              </p>
                            </div>
                            <div className="absolute top-2 right-2">
                              <ExternalLink className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                          {/* Status badge */}
                          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            submission.status === 'approved' ? 'bg-green-500/90 text-white' :
                            submission.status === 'winner' ? 'bg-amber-500/90 text-white' :
                            submission.status === 'rejected' ? 'bg-red-500/90 text-white' :
                            'bg-secondary/90 text-foreground'
                          }`}>
                            {submission.status}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary h-12 text-lg"
              disabled={isSubmitting || !photoFile || !title}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Submit Photo
                </>
              )}
            </Button>
          </form>
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

export default SubmitPhoto;
