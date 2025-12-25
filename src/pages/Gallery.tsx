import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Eye, 
  Heart, 
  User, 
  Loader2, 
  ImageIcon, 
  Info,
  Search,
  Grid3X3,
  LayoutGrid,
  X,
  CalendarIcon,
  Filter
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface GalleryPhoto {
  id: string;
  title: string;
  image_url: string;
  slug: string;
  view_count: number;
  like_count: number;
  status: string;
  created_at: string;
  user_id: string;
  contest: {
    id: string;
    title: string;
    slug: string;
  };
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ContestOption {
  id: string;
  title: string;
  slug: string;
}

interface PhotographerOption {
  id: string;
  full_name: string | null;
}

const ITEMS_PER_PAGE = 24;

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Masonry column heights for varied aspect ratios
const MASONRY_HEIGHTS = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[5/4]'];

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Layout state
  const [layout, setLayout] = useState<'grid' | 'masonry'>('masonry');

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedContest, setSelectedContest] = useState(searchParams.get('contest') || 'all');
  const [selectedPhotographer, setSelectedPhotographer] = useState(searchParams.get('photographer') || 'all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from || to) {
      return {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      };
    }
    return undefined;
  });

  // Filter options
  const [contests, setContests] = useState<ContestOption[]>([]);
  const [photographers, setPhotographers] = useState<PhotographerOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Track active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedContest !== 'all') count++;
    if (selectedPhotographer !== 'all') count++;
    if (dateRange?.from || dateRange?.to) count++;
    return count;
  }, [searchQuery, selectedContest, selectedPhotographer, dateRange]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      // Fetch contests
      const { data: contestsData } = await supabase
        .from('contests')
        .select('id, title, slug')
        .in('status', ['active', 'voting', 'completed'])
        .order('title');
      
      if (contestsData) setContests(contestsData);

      // Fetch photographers who have approved submissions
      const { data: submissionsWithUsers } = await supabase
        .from('submissions')
        .select('user_id')
        .in('status', ['approved', 'winner']);

      if (submissionsWithUsers) {
        const uniqueUserIds = [...new Set(submissionsWithUsers.map(s => s.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uniqueUserIds)
          .order('full_name');
        
        if (profilesData) setPhotographers(profilesData);
      }
    };

    fetchFilterOptions();
  }, []);

  const fetchPhotos = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let query = supabase
        .from('submissions')
        .select(`
          id,
          title,
          image_url,
          slug,
          view_count,
          like_count,
          status,
          created_at,
          contest_id,
          user_id
        `)
        .in('status', ['approved', 'winner'])
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      // Apply contest filter
      if (selectedContest && selectedContest !== 'all') {
        query = query.eq('contest_id', selectedContest);
      }

      // Apply photographer filter
      if (selectedPhotographer && selectedPhotographer !== 'all') {
        query = query.eq('user_id', selectedPhotographer);
      }

      // Apply date range filter
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      // Pagination
      query = query.range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      const { data: submissions, error } = await query;

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        setHasMore(false);
        if (reset) setPhotos([]);
        return;
      }

      // Fetch contest info
      const contestIds = [...new Set(submissions.map(s => s.contest_id))];
      const { data: contestsData } = await supabase
        .from('contests')
        .select('id, title, slug')
        .in('id', contestIds);

      const contestMap = new Map(contestsData?.map(c => [c.id, c]) || []);

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
          created_at: s.created_at,
          user_id: s.user_id,
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
  }, [searchQuery, selectedContest, selectedPhotographer, dateRange]);

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPhotos(0, true);

    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedContest !== 'all') params.set('contest', selectedContest);
    if (selectedPhotographer !== 'all') params.set('photographer', selectedPhotographer);
    if (dateRange?.from) params.set('from', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('to', format(dateRange.to, 'yyyy-MM-dd'));
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedContest, selectedPhotographer, dateRange, fetchPhotos, setSearchParams]);

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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedContest('all');
    setSelectedPhotographer('all');
    setDateRange(undefined);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

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
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Gallery</h1>
              <p className="text-muted-foreground text-lg">
                Discover authentic photography from talented creators around the world.
              </p>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={layout === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setLayout('grid')}
                title="Grid layout"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={layout === 'masonry' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setLayout('masonry')}
                title="Masonry layout"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="container mx-auto px-4 pb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button type="button" variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </form>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg border border-border bg-card">
                {/* Contest Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contest</label>
                  <Select value={selectedContest} onValueChange={setSelectedContest}>
                    <SelectTrigger>
                      <SelectValue placeholder="All contests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All contests</SelectItem>
                      {contests.map(contest => (
                        <SelectItem key={contest.id} value={contest.id}>
                          {contest.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Photographer Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Photographer</label>
                  <Select value={selectedPhotographer} onValueChange={setSelectedPhotographer}>
                    <SelectTrigger>
                      <SelectValue placeholder="All photographers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All photographers</SelectItem>
                      {photographers.map(photographer => (
                        <SelectItem key={photographer.id} value={photographer.id}>
                          {photographer.full_name || 'Anonymous'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'LLL dd, y')} -{' '}
                              {format(dateRange.to, 'LLL dd, y')}
                            </>
                          ) : (
                            format(dateRange.from, 'LLL dd, y')
                          )
                        ) : (
                          <span className="text-muted-foreground">Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="container mx-auto px-4 pb-12">
          {isLoading ? (
            <div className={layout === 'masonry' 
              ? 'columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4'
              : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            }>
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className={layout === 'masonry' 
                    ? `break-inside-avoid ${MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length]}`
                    : 'aspect-square'
                  }
                >
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {activeFiltersCount > 0 ? 'No photos match your filters' : 'No photos yet'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {activeFiltersCount > 0 
                  ? 'Try adjusting your search or filters.'
                  : 'Be the first to submit a photo to one of our contests.'
                }
              </p>
              {activeFiltersCount > 0 ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear filters
                </Button>
              ) : (
                <Link
                  to="/contests"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Browse Contests
                </Link>
              )}
            </div>
          ) : (
            <>
              {layout === 'masonry' ? (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {photos.map((photo, index) => (
                    <Link
                      key={photo.id}
                      to={`/photo/${photo.contest.slug}/${photo.slug}`}
                      className={`group relative break-inside-avoid block rounded-xl overflow-hidden bg-secondary mb-4 ${MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length]}`}
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
              ) : (
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
              )}

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
