import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2, Trophy, Users, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface SavedContest {
  id: string;
  contest_id: string;
  created_at: string;
  contests: {
    id: string;
    title: string;
    description: string | null;
    theme: string | null;
    prize_amount: number;
    prize_currency: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';
    cover_image_url: string | null;
  };
}

const SavedContests = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [savedContests, setSavedContests] = useState<SavedContest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedContests = async () => {
      if (authLoading && !user) return;

      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("saved_contests")
          .select(
            `
            id,
            contest_id,
            created_at,
            contests (
              id,
              title,
              description,
              theme,
              prize_amount,
              prize_currency,
              start_date,
              end_date,
              status,
              cover_image_url
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching saved contests:", error);
          toast.error(error.message || "Failed to load saved contests");
          setSavedContests([]);
          return;
        }

        setSavedContests((data as unknown as SavedContest[]) || []);
      } catch (e) {
        console.error("Exception fetching saved contests:", e);
        toast.error("Failed to load saved contests");
        setSavedContests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedContests();
  }, [user, authLoading]);

  const handleUnsave = async (savedId: string, contestTitle: string) => {
    const { error } = await supabase
      .from("saved_contests")
      .delete()
      .eq("id", savedId);

    if (error) {
      toast.error("Failed to remove from saved");
    } else {
      setSavedContests((prev) => prev.filter((s) => s.id !== savedId));
      toast.success(`"${contestTitle}" removed from saved`);
    }
  };

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    if (end < now) return "Ended";
    return formatDistanceToNow(end, { addSuffix: false }) + " left";
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { label: "🔴 Live", className: "bg-primary text-primary-foreground" };
      case 'voting':
        return { label: "🗳️ Voting", className: "bg-accent text-accent-foreground" };
      case 'completed':
        return { label: "Ended", className: "bg-muted text-muted-foreground" };
      default:
        return { label: status, className: "bg-muted text-muted-foreground" };
    }
  };

  const defaultImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Saved Contests
          </h1>
          <p className="text-muted-foreground">
            Your collection of saved photo contests
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : savedContests.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No saved contests</h2>
              <p className="text-muted-foreground mb-6">
                Start exploring and save contests you're interested in!
              </p>
              <Link to="/contests">
                <Button>Browse Contests</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedContests.map((saved) => {
              const contest = saved.contests;
              const statusDisplay = getStatusDisplay(contest.status);
              
              return (
                <Card key={saved.id} className="bg-card border-border overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={contest.cover_image_url || defaultImage}
                      alt={contest.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                        {statusDisplay.label}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-background/50 hover:bg-background/80"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnsave(saved.id, contest.title);
                      }}
                    >
                      <Heart className="w-4 h-4 fill-primary text-primary" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4">
                    <Link to={`/contest/${contest.id}`}>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-1 hover:text-primary transition-colors">
                        {contest.title}
                      </h3>
                    </Link>
                    {contest.theme && (
                      <p className="text-sm text-muted-foreground mb-3">{contest.theme}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-primary">
                        <Trophy className="w-4 h-4" />
                        <span className="font-medium">
                          {contest.prize_currency} {contest.prize_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeLeft(contest.end_date)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Saved {format(new Date(saved.created_at), "MMM d, yyyy")}
                      </span>
                      <Link to={`/contest/${contest.id}`}>
                        <Button size="sm" variant="outline">
                          View Contest
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SavedContests;
