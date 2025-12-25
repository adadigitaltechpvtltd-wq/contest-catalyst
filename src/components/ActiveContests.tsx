import { useEffect, useState } from "react";
import { Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, isPast, isFuture } from "date-fns";

interface Contest {
  id: string;
  title: string;
  description: string | null;
  prize_amount: number;
  prize_currency: string;
  start_date: string;
  end_date: string;
  status: string;
  theme: string | null;
  cover_image_url: string | null;
}

const getContestStatus = (contest: Contest): "live" | "soon" | "ended" => {
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

const gradientBorders = [
  "from-orange-500 via-red-500 to-pink-500",
  "from-purple-500 via-pink-500 to-red-500",
  "from-yellow-500 via-orange-500 to-red-500",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-emerald-500 via-green-500 to-lime-500",
  "from-indigo-500 via-purple-500 to-pink-500",
];

const ActiveContests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchContests = async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("id, title, description, prize_amount, prize_currency, start_date, end_date, status, theme, cover_image_url")
        .in("status", ["active", "voting", "completed"])
        .eq("featured_in_hero", false)
        .order("start_date", { ascending: false })
        .limit(4);

      if (!error && data) {
        setContests(data);
        
        // Fetch participant counts for each contest
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (contest) => {
            const { count } = await supabase
              .from("submissions")
              .select("*", { count: "exact", head: true })
              .eq("contest_id", contest.id);
            counts[contest.id] = count ?? 0;
          })
        );
        setParticipantCounts(counts);
      }
      setLoading(false);
    };

    fetchContests();
  }, []);

  if (loading) {
    return (
      <section id="contests" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Active <span className="text-gradient">Contests</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Discover challenges that spark your creativity. New contests launch every week.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
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
        </div>
      </section>
    );
  }

  return (
    <section id="contests" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Active <span className="text-gradient">Contests</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover challenges that spark your creativity. New contests launch every week.
          </p>
        </div>

        {/* Contest Grid */}
        {contests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active contests at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {contests.map((contest, i) => {
              const status = getContestStatus(contest);
              const timeDisplay = getTimeDisplay(contest, status);
              const gradientBorder = gradientBorders[i % gradientBorders.length];

              return (
                <div 
                  key={contest.id}
                  className={`group relative overflow-hidden rounded-2xl bg-card transition-all duration-300 ${
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
                          {contest.cover_image_url ? (
                            <img 
                              src={contest.cover_image_url} 
                              alt={contest.title} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-lg">📷</span>
                          )}
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
                      <Link to={`/contest/${contest.id}`}>
                        <Button className="w-full">
                          Enter Contest <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    ) : status === "soon" ? (
                      <Button variant="outline" className="w-full">
                        Notify Me <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Link to={`/contest/${contest.id}`}>
                        <Button variant="ghost" className="w-full text-muted-foreground">
                          View Winners <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All */}
        <div className="text-center">
          <Link to="/contests">
            <Button variant="outline" size="lg">
              View All Contests
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ActiveContests;
