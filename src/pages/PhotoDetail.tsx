import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePhotoDetailQuery } from '@/hooks/usePhotoDetailQuery';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import InlineAuthDialog from '@/components/InlineAuthDialog';
import DownloadConfirmModal from '@/components/DownloadConfirmModal';
import ErrorState from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Download, 
  Heart, 
  Share2, 
  Calendar,
  Trophy,
  ExternalLink,
  Loader2,
  Camera,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getGalleryCanonicalUrl } from '@/lib/seoUtils';

const PhotoDetail = () => {
  // Support both new format (/gallery/:category/:contestSlug/:photoSlug) and legacy format (/photo/:contestSlug/:photoSlug)
  const { category, contestSlug, photoSlug } = useParams<{ category?: string; contestSlug: string; photoSlug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data, isLoading, isError, refetch } = usePhotoDetailQuery(contestSlug, photoSlug);
  const photo = data?.photo ?? null;
  const relatedPhotos = data?.relatedPhotos ?? [];

  const [hasLiked, setHasLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Handle redirects for category mismatch or legacy URLs
  useEffect(() => {
    if (!photo) return;

    const contestCategory = photo.contest.category || 'general';
    const currentPath = window.location.pathname;

    // Handle legacy /photo/ URLs - redirect to /gallery/ with category
    if (currentPath.startsWith('/photo/')) {
      navigate(`/gallery/${contestCategory}/${contestSlug}/${photoSlug}`, { replace: true });
      return;
    }

    // Validate category matches - redirect to correct URL if mismatch
    if (category && category !== contestCategory) {
      navigate(`/gallery/${contestCategory}/${contestSlug}/${photoSlug}`, { replace: true });
    }
  }, [photo, category, contestSlug, photoSlug, navigate]);

  // Update local like count when photo loads
  useEffect(() => {
    if (photo) {
      setLocalLikeCount(photo.like_count);
    }
  }, [photo]);

  // Increment view count
  useEffect(() => {
    if (photo && (photo.status === 'approved' || photo.status === 'winner')) {
      supabase.rpc('increment_view_count', { submission_id_param: photo.id });
    }
  }, [photo]);

  // Check if user has liked
  useEffect(() => {
    const checkLike = async () => {
      if (!user || !photo) return;
      
      const { data } = await supabase
        .from('submission_likes')
        .select('id')
        .eq('submission_id', photo.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setHasLiked(!!data);
    };

    checkLike();
  }, [user, photo]);

  // Redirect if no photo found
  useEffect(() => {
    if (!isLoading && !photo && contestSlug && photoSlug) {
      navigate('/gallery');
    }
  }, [isLoading, photo, contestSlug, photoSlug, navigate]);

  const handleLike = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (!photo) return;

    // Optimistic update
    setHasLiked(!hasLiked);
    setLocalLikeCount(prev => hasLiked ? prev - 1 : prev + 1);

    try {
      if (hasLiked) {
        await supabase
          .from('submission_likes')
          .delete()
          .eq('submission_id', photo.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('submission_likes')
          .insert({ submission_id: photo.id, user_id: user.id });
      }
    } catch (error) {
      // Revert on error
      setHasLiked(hasLiked);
      setLocalLikeCount(photo.like_count);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadClick = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setShowDownloadModal(true);
  };

  const handleDownloadConfirm = async () => {
    if (!photo) return;

    try {
      await supabase.rpc('increment_download_count', { submission_id_param: photo.id });
      
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${photo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded',
        description: 'Photo saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!photo) return;
    
    const url = window.location.href;
    const text = `Check out "${photo.title}" on GAAL`;
    
    if (navigator.share) {
      await navigator.share({ title: photo.title, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Photo link copied to clipboard',
      });
    }
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
            title="Failed to load photo" 
            message="Could not load photo data." 
            onRetry={refetch} 
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (!photo) {
    return null;
  }

  const photographerName = photo.profile?.full_name || photo.profile?.username || 'Anonymous';
  const isApproved = photo.status === 'approved' || photo.status === 'winner';
  
  // Check if title quality is flagged as low (should not be indexed)
  const hasTitleQualityIssue = photo.title_quality_flag === 'low';
  
  // Use stored SEO fields if available, otherwise auto-generate
  const contestCategory = photo.contest.category || 'general';
  const contestSeoTitle = photo.contest.seo_title || photo.contest.title;
  const seoTitle = photo.seo_title 
    ? photo.seo_title 
    : `${photo.title} - ${contestSeoTitle}`;
  const seoDescription = photo.meta_description
    ? photo.meta_description
    : photo.description 
      ? `${photo.description.slice(0, 100)}... Photo from ${photo.contest.title} contest on GAAL.`
      : `${photo.title} - Photography submission for ${contestSeoTitle}. ${photo.contest.meta_description || ''}`.slice(0, 160);
  const canonicalUrl = getGalleryCanonicalUrl(contestCategory, photo.contest.slug, photo.slug);
  
  // Only index if approved AND title passes quality validation
  const shouldNoIndex = !isApproved || hasTitleQualityIssue;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        ogImage={photo.image_url}
        ogType="article"
        noIndex={shouldNoIndex}
      />
      
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 py-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
            </li>
            <li>/</li>
            <li>
              <span className="capitalize">{contestCategory.replace(/-/g, ' ')}</span>
            </li>
            <li>/</li>
            <li>
              <Link to={`/contest/${contestCategory}/${photo.contest.slug}`} className="hover:text-foreground transition-colors">
                {photo.contest.title}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground font-medium truncate max-w-[200px]">{photo.title}</li>
          </ol>
        </nav>

        <article className="container mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Image */}
            <div className="lg:col-span-2">
            <div className="relative rounded-xl overflow-hidden bg-secondary">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  loading="eager"
                  fetchPriority="high"
                  width={1200}
                  height={800}
                />
                
                {photo.status === 'winner' && (
                  <Badge className="absolute top-4 left-4 bg-accent gap-1 text-base px-4 py-2">
                    <Trophy className="h-4 w-4" />
                    Winner
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant={hasLiked ? 'default' : 'outline'}
                    onClick={handleLike}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                    {localLikeCount}
                  </Button>
                  <Button variant="outline" onClick={handleDownloadClick} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {photo.view_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {photo.download_count} downloads
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Photo Info */}
              <div className="p-6 rounded-xl bg-card border border-border">
                <h1 className="text-2xl font-bold mb-2">{photo.title}</h1>
                
                {photo.description && (
                  <p className="text-muted-foreground mb-4">{photo.description}</p>
                )}

                {/* Category Badge */}
                <Badge variant="secondary" className="mb-4 capitalize">
                  {contestCategory.replace(/-/g, ' ')}
                </Badge>

                <Separator className="my-4" />

                {/* Photographer */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={photo.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      <Camera className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{photographerName}</p>
                    <p className="text-sm text-muted-foreground">Photographer</p>
                  </div>
                </div>

                {/* Upload Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Uploaded {format(new Date(photo.created_at), 'MMMM d, yyyy')}</span>
                </div>
              </div>

              {/* Contest Info */}
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-lg font-semibold mb-3">From Contest</h2>
                <Link 
                  to={`/contest/${contestCategory}/${photo.contest.slug}`}
                  className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <h3 className="font-medium mb-1">{photo.contest.title}</h3>
                  {photo.contest.theme && (
                    <p className="text-sm text-muted-foreground mb-2">{photo.contest.theme}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Trophy className="h-4 w-4" />
                    ${photo.contest.prize_amount} {photo.contest.prize_currency}
                  </div>
                </Link>
              </div>

              {/* Explore More */}
              <div className="p-6 rounded-xl bg-card border border-border">
                <Link 
                  to="/gallery" 
                  className="flex items-center justify-between text-primary hover:underline"
                >
                  <span className="font-medium">Explore the Gallery</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {/* Image Usage Notice */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Images are provided for personal inspiration and viewing only. 
                    Not for commercial use without creator consent.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Related Photos */}
          {relatedPhotos.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold mb-6">More from this contest</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedPhotos.map((related) => (
                  <Link
                    key={related.id}
                    to={`/gallery/${contestCategory}/${contestSlug}/${related.slug}`}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
                  >
                    <img
                      src={related.image_url}
                      alt={related.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                      width={400}
                      height={400}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{related.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      
      <Footer />

      <InlineAuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        title="Sign in to like photos"
        description="Create an account or sign in to like and interact with photos."
      />

      <DownloadConfirmModal
        open={showDownloadModal}
        onOpenChange={setShowDownloadModal}
        onConfirm={handleDownloadConfirm}
        photoTitle={photo.title}
      />

      {/* Structured Data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "@id": canonicalUrl,
          "name": photo.title,
          "description": seoDescription,
          "contentUrl": canonicalUrl,
          "thumbnailUrl": photo.image_url,
          "uploadDate": photo.created_at,
          "author": {
            "@type": "Person",
            "name": photographerName
          },
          "creator": {
            "@type": "Person",
            "name": photographerName
          },
          "copyrightHolder": {
            "@type": "Person",
            "name": photographerName
          },
          "acquireLicensePage": canonicalUrl,
          "license": "https://gaal.app/terms",
          "interactionStatistic": [
            {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/ViewAction",
              "userInteractionCount": photo.view_count
            },
            {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/LikeAction",
              "userInteractionCount": localLikeCount
            },
            {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/DownloadAction",
              "userInteractionCount": photo.download_count
            }
          ],
          "isPartOf": {
            "@type": "CreativeWork",
            "name": photo.contest.title,
            "url": `https://gaal.app/contest/${contestCategory}/${photo.contest.slug}`
          }
        })
      }} />
    </div>
  );
};

export default PhotoDetail;
