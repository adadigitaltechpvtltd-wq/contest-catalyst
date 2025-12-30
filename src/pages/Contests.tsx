import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorState from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Users, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, isPast, isFuture, differenceInDays } from 'date-fns';
import { useContestsQuery, ContestWithCount } from '@/hooks/useContestsQuery';

const gradientBorders = [
  "from-orange-500 via-red-500 to-pink-500",
  "from-purple-500 via-pink-500 to-red-500",
  "from-yellow-500 via-orange-500 to-red-500",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-emerald-500 via-green-500 to-lime-500",
  "from-indigo-500 via-purple-500 to-pink-500",
];

const getContestDisplayStatus = (contest: ContestWithCount): "live" | "soon" | "ended" => {
  const now = new Date();
  const start = new Date(contest.start_date);
  const end = new Date(contest.end_date);

  if (contest.status === "completed" || isPast(end)) return "ended";
  if (isFuture(start)) return "soon";
  return "live";
};

const getTimeDisplay = (contest: ContestWithCount, status: "live" | "soon" | "ended"): string => {
  if (status === "ended") return "Ended";
  if (status === "soon") {
    return `Starts ${formatDistanceToNow(new Date(contest.start_date), { addSuffix: true })}`;
  }
  return formatDistanceToNow(new Date(contest.end_date), { addSuffix: false }) + " left";
};

const getDaysLeft = (endDate: string): number => {
  return differenceInDays(new Date(endDate), new Date());
};

const formatPrize = (amount: number, currency: string) => {
  if (currency === "USD") return `$${amount.toLocaleString()}`;
  if (currency === "INR") return `₹${amount.toLocaleString()}`;
  return `$${amount.toLocaleString()}`;
};

const Contests = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { data: contests = [], isLoading, error, refetch } = useContestsQuery();

  const now = new Date();
  const activeContests = contests.filter((c) => 
    (c.status === 'active' || c.status === 'voting') && new Date(c.end_date) > now
  );
  const completedContests = contests.filter((c) => 
    c.status === 'completed' || new Date(c.end_date) <= now
  );

  const ContestCard = ({ contest, index }: { contest: ContestWithCount; index: number }) => {
    const status = getContestDisplayStatus(contest);
    const timeDisplay = getTimeDisplay(contest, status);
    const gradientBorder = gradientBorders[index % gradientBorders.length];

    return (
      <div 
        className={`group relative overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex flex-col ${
          status === "ended" ? "opacity-60" : ""
        }`}
      >
        {/* Image Banner */}
        <div className="relative w-full h-48 overflow-hidden bg-muted">
          {contest.cover_image_url ? (
            <>
              <img 
                src={contest.cover_image_url} 
                alt={contest.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              {/* Image Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-5xl">📷</span>
            </div>
          )}

          {/* Status Badge */}
          <span className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            status === "live" 
              ? "bg-primary text-primary-foreground" 
              : status === "soon"
              ? "bg-amber-500 text-black"
              : "bg-muted/90 text-foreground"
          }`}>
            {status === "live" ? "🔴 Live" : status === "soon" ? "⏰ Soon" : "✓ Ended"}
          </span>

          {/* Share Button & Days Left - Bottom of image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full"
              onClick={() => {
                const url = window.location.origin + `/contest/${contest.slug || contest.id}`;
                navigator.share?.({ title: contest.title, url }) || navigator.clipboard.writeText(url);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            {status === "live" && (
              <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                {getDaysLeft(contest.end_date)} {getDaysLeft(contest.end_date) === 1 ? 'day' : 'days'} left
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative p-5 flex-grow flex flex-col">
          {/* Header */}
          <div className="mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{contest.theme || "Participation Campaign"}</span>
            <h3 className="font-display font-bold text-lg text-foreground line-clamp-2 mt-1">"{contest.title}"</h3>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
            {contest.description || "Join this participation campaign and share your authentic experience!"}
          </p>


          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm border-t border-border pt-4">
            <span className="flex items-center gap-2">
              {contest.prize_amount === 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">🎉 FREE</span>
              ) : (
                <>
                  <span className="text-primary font-semibold">🏆</span>
                  <span className="text-foreground font-semibold">{formatPrize(contest.prize_amount, contest.prize_currency)}</span>
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground ml-auto">
              <Users className="w-4 h-4" />
              <span className="text-foreground font-medium">{contest.participantCount}</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-foreground font-medium">{timeDisplay}</span>
            </span>
          </div>

          {/* Action Button */}
          {status === "live" ? (
            <Link to={`/contest/${contest.slug || contest.id}`} className="w-full">
              <Button className="w-full">
                Join Campaign <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : status === "soon" ? (
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          ) : (
            <Link to={`/contest/${contest.slug || contest.id}`} className="w-full">
              <Button variant="ghost" className="w-full text-muted-foreground">
                View Results <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl bg-card p-5 pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Explore Campaigns
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Participation <span className="text-gradient">Campaigns</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join real participation campaigns powered by authentic users. Share your experiences and earn rewards.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'completed')}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="active">
              Live ({activeContests.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedContests.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState
              title="Failed to Load Campaigns"
              message="Failed to load campaigns"
              onRetry={() => refetch()}
            />
          ) : (
            <>
              <TabsContent value="active">
                {activeContests.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Live Campaigns</h3>
                    <p className="text-muted-foreground">
                      Check back soon for new participation campaigns!
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {activeContests.map((contest, index) => (
                      <ContestCard key={contest.id} contest={contest} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedContests.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Completed Campaigns Yet</h3>
                    <p className="text-muted-foreground">
                      Completed campaigns will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {completedContests.map((contest, index) => (
                      <ContestCard key={contest.id} contest={contest} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Contests;
