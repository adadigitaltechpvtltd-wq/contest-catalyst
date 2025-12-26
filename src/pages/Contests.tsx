import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorState from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';

type ContestStatus = 'active' | 'voting' | 'completed';

interface Contest {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  theme: string | null;
  cover_image_url: string | null;
  prize_amount: number;
  prize_currency: string;
  min_participants: number;
  start_date: string;
  end_date: string;
  status: ContestStatus;
}

const gradientBorders = [
  "from-orange-500 via-red-500 to-pink-500",
  "from-purple-500 via-pink-500 to-red-500",
  "from-yellow-500 via-orange-500 to-red-500",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-emerald-500 via-green-500 to-lime-500",
  "from-indigo-500 via-purple-500 to-pink-500",
];

const getContestDisplayStatus = (contest: Contest): "live" | "soon" | "ended" => {
  const now = new Date();
  const start = new Date(contest.start_date);
  const end = new Date(contest.end_date);

  if (contest.status === "completed" || isPast(end)) return "ended";
  if (isFuture(start)) return "soon";
  return "live";
};

const getTimeDisplay = (contest: Contest, status: "live" | "soon" | "ended"): string => {
  if (status === "ended") return "Ended";
  if (status === "soon") {
    return `Starts ${formatDistanceToNow(new Date(contest.start_date), { addSuffix: true })}`;
  }
  return formatDistanceToNow(new Date(contest.end_date), { addSuffix: false }) + " left";
};

const formatPrize = (amount: number, currency: string) => {
  if (currency === "USD") return `$${amount.toLocaleString()}`;
  if (currency === "INR") return `₹${amount.toLocaleString()}`;
  return `$${amount.toLocaleString()}`;
};

const Contests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .in('status', ['active', 'voting', 'completed'])
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching contests:', error);
      setError('Failed to load contests');
      toast.error('Failed to load contests. Please try again.');
    } else {
      setContests(data as Contest[]);
      
      // Fetch participant counts for each contest
      if (data) {
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (contest) => {
            try {
              const { count } = await supabase
                .from("submissions")
                .select("*", { count: "exact", head: true })
                .eq("contest_id", contest.id);
              counts[contest.id] = count ?? 0;
            } catch {
              counts[contest.id] = 0;
            }
          })
        );
        setParticipantCounts(counts);
      }
    }
    setIsLoading(false);
  };

  const now = new Date();
  const activeContests = contests.filter((c) => 
    (c.status === 'active' || c.status === 'voting') && new Date(c.end_date) > now
  );
  const completedContests = contests.filter((c) => 
    c.status === 'completed' || new Date(c.end_date) <= now
  );

  const ContestCard = ({ contest, index }: { contest: Contest; index: number }) => {
    const status = getContestDisplayStatus(contest);
    const timeDisplay = getTimeDisplay(contest, status);
    const gradientBorder = gradientBorders[index % gradientBorders.length];

    return (
      <div 
        className={`group relative overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:border-primary/50 ${
          status === "ended" ? "opacity-60" : ""
        }`}
      >
        {/* Gradient top border */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientBorder}`} />
        
        <div className="relative p-5 pt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                <span className="text-lg">📷</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{contest.theme || "Photography"}</span>
                <h3 className="font-display font-bold text-foreground">"{contest.title}"</h3>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              status === "live" 
                ? "bg-primary text-primary-foreground" 
                : status === "soon"
                ? "bg-amber-500 text-black"
                : "bg-muted text-muted-foreground"
            }`}>
              {status === "live" ? "Live" : status === "soon" ? "Soon" : "Ended"}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {contest.description || "Join this exciting photography challenge!"}
          </p>

          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="flex items-center gap-1.5 text-foreground">
              {contest.prize_amount === 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">🎉 FREE</span>
              ) : (
                <>
                  <span className="text-primary">🏆</span>
                  {formatPrize(contest.prize_amount, contest.prize_currency)}
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              {participantCounts[contest.id] ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {timeDisplay}
            </span>
          </div>

          {/* Action */}
          {status === "live" ? (
            <Link to={`/contest/${contest.slug || contest.id}`}>
              <Button className="w-full">
                Enter Contest <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : status === "soon" ? (
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          ) : (
            <Link to={`/contest/${contest.slug || contest.id}`}>
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
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Photography <span className="text-gradient">Contests</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join skill-based photography contests and win amazing prizes.
            All contests are free to enter!
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'completed')}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="active">
              Active ({activeContests.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedContests.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState
              title="Failed to Load Contests"
              message={error}
              onRetry={fetchContests}
            />
          ) : (
            <>
              <TabsContent value="active">
                {activeContests.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Active Contests</h3>
                    <p className="text-muted-foreground">
                      Check back soon for new photography contests!
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
                    <h3 className="text-xl font-semibold mb-2">No Completed Contests Yet</h3>
                    <p className="text-muted-foreground">
                      Completed contests will appear here.
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
