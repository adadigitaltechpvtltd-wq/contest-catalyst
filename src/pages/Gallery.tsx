import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Eye, Heart, User, Loader2, ImageIcon, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GalleryPhoto {
  id: string;
  title: string;
  image_url: string;
  slug: string;
  view_count: number;
  like_count: number;
  status: string;
  contest: {
    id: string;
    title: string;
    slug: string;
  };
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 24;

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const Gallery = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loadingRef = useRef<HTMLDivElement>(null);

  const fetchPhotos = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          image_url,
          slug,
          view_count,
          like_count,
          status,
          contest_id,
          user_id
        `)
        .in('status', ['approved', 'winner'])
        .order('created_at', { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        setHasMore(false);
        if (reset) setPhotos([]);
        return;
      }

      // Fetch contest info
      const contestIds = [...new Set(submissions.map(s => s.contest_id))];
      const { data: contests } = await supabase
        .from('contests')
        .select('id, title, slug')
        .in('id', contestIds);

      const contestMap = new Map(contests?.map(c => [c.id, c]) || []);

      // Fetch profile info
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const photosWithData: GalleryPhoto[] = submissions
        .filter(s => contestMap.has(s.contest_id))
        .map(s => ({
          id: s.id,
          title: s.title,
          image_url: s.image_url,
          slug: s.slug || '',
          view_count: s.view_count,
          like_count: s.like_count,
          status: s.status,
          contest: contestMap.get(s.contest_id)!,
          profile: profileMap.get(s.user_id) || null,
        }));

      if (reset) {
        setPhotos(photosWithData);
      } else {
        setPhotos(prev => [...prev, ...photosWithData]);
      }

      setHasMore(submissions.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching gallery photos:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos(0, true);
  }, [fetchPhotos]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  // Load more when page changes
  useEffect(() => {
    if (page > 0) {
      fetchPhotos(page);
    }
  }, [page, fetchPhotos]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Gallery - Photography Showcase"
        description="Explore authentic user-submitted photography from GAAL contests. Discover inspiring images from talented photographers worldwide."
        canonicalUrl="https://gaal.app/gallery"
        ogType="website"
      />

      <Navbar />

      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Gallery</h1>
            <p className="text-muted-foreground text-lg">
              Discover authentic photography from talented creators around the world. 
              Browse submissions from our photo contests for inspiration.
            </p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="container mx-auto px-4 pb-12">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square">
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No photos yet</h2>
              <p className="text-muted-foreground mb-6">
                Be the first to submit a photo to one of our contests.
              </p>
              <Link
                to="/contests"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Browse Contests
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <Link
                    key={photo.id}
                    to={`/photo/${photo.contest.slug}/${photo.slug}`}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-secondary"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Bottom Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm font-medium text-foreground truncate mb-1">
                          {photo.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {photo.contest.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {photo.profile?.avatar_url ? (
                              <img
                                src={photo.profile.avatar_url}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover ring-2 ring-background"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                                <User className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                              {photo.profile?.full_name || 'Anonymous'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatCount(photo.view_count)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {formatCount(photo.like_count)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Loading more indicator */}
              <div ref={loadingRef} className="flex justify-center py-8">
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
            </>
          )}
        </div>

        {/* Image Usage Notice */}
        <div className="bg-muted/50 border-t border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start gap-3 max-w-3xl">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Image Usage Notice</p>
                <p>
                  Images are provided for personal inspiration and viewing only. 
                  Not for commercial use. All images remain the property of their respective creators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;
