import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorState from '@/components/ErrorState';
import ContestCardSkeleton from '@/components/skeletons/ContestCardSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Users, Camera } from 'lucide-react';
import { toast } from 'sonner';

type ContestStatus = 'active' | 'voting' | 'completed';

interface Contest {
  id: string;
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

const Contests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

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
    }
    setIsLoading(false);
  };

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status: ContestStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success">Live</Badge>;
      case 'voting':
        return <Badge className="bg-accent">Voting</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  const activeContests = contests.filter((c) => c.status === 'active' || c.status === 'voting');
  const completedContests = contests.filter((c) => c.status === 'completed');

  const ContestCard = ({ contest }: { contest: Contest }) => (
    <Card className="glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
      <div className="relative aspect-video overflow-hidden">
        {contest.cover_image_url ? (
          <img
            src={contest.cover_image_url}
            alt={contest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Camera className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          {getStatusBadge(contest.status)}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            <Trophy className="h-3 w-3 mr-1" />
            ${contest.prize_amount}
          </Badge>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="text-xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">
          {contest.title}
        </h3>
        {contest.theme && (
          <p className="text-sm text-muted-foreground mb-3">Theme: {contest.theme}</p>
        )}
        {contest.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {contest.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {contest.status === 'completed' ? 'Ended' : formatTimeLeft(contest.end_date)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Min {contest.min_participants}
          </span>
        </div>
        <Button asChild className="w-full">
          <Link to={`/contest/${contest.id}`}>
            {contest.status === 'completed' ? 'View Results' : 'View Contest'}
          </Link>
        </Button>
      </CardContent>
    </Card>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ContestCardSkeleton key={i} />
              ))}
            </div>
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
                    <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Active Contests</h3>
                    <p className="text-muted-foreground">
                      Check back soon for new photography contests!
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeContests.map((contest) => (
                      <ContestCard key={contest.id} contest={contest} />
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
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedContests.map((contest) => (
                      <ContestCard key={contest.id} contest={contest} />
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
