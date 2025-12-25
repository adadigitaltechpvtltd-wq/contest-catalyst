import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Camera,
  Target,
  Award,
  TrendingUp,
  Eye,
  Heart,
  ArrowLeft,
  Calendar,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  Instagram,
  Twitter,
  ExternalLink,
} from "lucide-react";

interface UserStats {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wins: number;
  total_submissions: number;
  contests_entered: number;
  total_points: number;
}

interface SubmissionWithScore {
  id: string;
  title: string;
  image_url: string;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  system_score: number | null;
  image_quality_score: number | null;
  visual_anomaly_score: number | null;
  duplicate_similarity_score: number | null;
  risk_score: number | null;
  view_count: number;
  like_count: number;
  contest: {
    id: string;
    title: string;
    slug: string | null;
  } | null;
}

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();

  // First, resolve username to user_id (supports both username and UUID)
  const { data: resolvedUserId, isLoading: resolvingUser } = useQuery({
    queryKey: ["resolve-user", username],
    queryFn: async () => {
      // Check if it's a UUID format (fallback for old links)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(username || "")) {
        return username;
      }
      
      // Look up by username
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;
      return data?.id || null;
    },
    enabled: !!username,
  });

  // Fetch user stats from leaderboard
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats", resolvedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .eq("user_id", resolvedUserId)
        .maybeSingle();

      if (error) throw error;
      return data as UserStats | null;
    },
    enabled: !!resolvedUserId,
  });

  // Fetch social links from profiles
  const { data: socialLinks } = useQuery({
    queryKey: ["user-social-links", resolvedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("instagram_url, twitter_url")
        .eq("id", resolvedUserId)
        .maybeSingle();

      if (error) throw error;
      return data as { instagram_url: string | null; twitter_url: string | null } | null;
    },
    enabled: !!resolvedUserId,
  });

  // Fetch user rank
  const { data: userRank } = useQuery({
    queryKey: ["user-rank", resolvedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_stats")
        .select("user_id, total_points")
        .order("total_points", { ascending: false });

      if (error) throw error;

      const rank = data?.findIndex((u) => u.user_id === resolvedUserId);
      return rank !== undefined && rank >= 0 ? rank + 1 : null;
    },
    enabled: !!resolvedUserId,
  });

  // Fetch user's submissions with scores
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["user-submissions", resolvedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          `
          id,
          title,
          image_url,
          thumbnail_url,
          status,
          created_at,
          system_score,
          image_quality_score,
          visual_anomaly_score,
          duplicate_similarity_score,
          risk_score,
          view_count,
          like_count,
          contest:contests(id, title, slug)
        `
        )
        .eq("user_id", resolvedUserId)
        .in("status", ["approved", "winner"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SubmissionWithScore[];
    },
    enabled: !!resolvedUserId,
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankBadge = (rank: number | null | undefined) => {
    if (!rank) return null;
    if (rank === 1)
      return (
        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
          <Trophy className="w-3 h-3 mr-1" />
          #1 Champion
        </Badge>
      );
    if (rank === 2)
      return (
        <Badge className="bg-gray-400/20 text-gray-400 border-gray-400/30">
          <Award className="w-3 h-3 mr-1" />
          #2 Runner-up
        </Badge>
      );
    if (rank === 3)
      return (
        <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">
          <Award className="w-3 h-3 mr-1" />
          #3 Bronze
        </Badge>
      );
    if (rank <= 10)
      return (
        <Badge variant="secondary">
          <TrendingUp className="w-3 h-3 mr-1" />
          Top 10
        </Badge>
      );
    return (
      <Badge variant="outline">
        Rank #{rank}
      </Badge>
    );
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const isLoading = resolvingUser || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-8 w-32 mb-8" />
              <div className="flex items-center gap-6 mb-8">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h1 className="text-2xl font-bold text-foreground mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This photographer doesn't exist or hasn't submitted any photos yet.
            </p>
            <Link to="/leaderboard">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leaderboard
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leaderboard
            </Link>

            {/* Profile Header */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-primary/20">
                  <AvatarImage src={userStats.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {getInitials(userStats.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {userStats.full_name || "Anonymous Photographer"}
                    </h1>
                    {getRankBadge(userRank)}
                  </div>
                  {userStats.bio && (
                    <p className="text-muted-foreground mb-4 max-w-lg">{userStats.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      {userStats.wins} wins
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera className="w-4 h-4" />
                      {userStats.total_submissions} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {userStats.contests_entered} contests
                    </span>
                  </div>

                  {/* Social Links */}
                  {(socialLinks?.instagram_url || socialLinks?.twitter_url) && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                      {socialLinks?.instagram_url && (
                        <a
                          href={socialLinks.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-pink-500 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors text-sm"
                        >
                          <Instagram className="w-4 h-4" />
                          Instagram
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {socialLinks?.twitter_url && (
                        <a
                          href={socialLinks.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 transition-colors text-sm"
                        >
                          <Twitter className="w-4 h-4" />
                          Twitter
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center md:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                  <p className="text-4xl font-display font-bold text-primary">
                    {userStats.total_points.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Points Breakdown */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Points Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{userStats.wins}</p>
                    <p className="text-xs text-muted-foreground">Contest Wins</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <Camera className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{userStats.total_submissions}</p>
                    <p className="text-xs text-muted-foreground">Total Submissions</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <Target className="w-6 h-6 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{userStats.contests_entered}</p>
                    <p className="text-xs text-muted-foreground">Contests Joined</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      {userStats.total_points.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">System Score Points</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Points are calculated from system analysis scores on approved submissions only
                </p>
              </CardContent>
            </Card>

            {/* Submission History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Submission History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </div>
                ) : !submissions || submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No approved submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/30 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={submission.thumbnail_url || submission.image_url}
                            alt={submission.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-medium text-foreground truncate">
                                {submission.title}
                              </h3>
                              {submission.contest && (
                                <p className="text-xs text-muted-foreground">
                                  in {submission.contest.title}
                                </p>
                              )}
                            </div>
                            {submission.status === "winner" && (
                              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 flex-shrink-0">
                                <Trophy className="w-3 h-3 mr-1" />
                                Winner
                              </Badge>
                            )}
                          </div>

                          {/* Scores */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Quality:</span>
                              <span className={getScoreColor(submission.image_quality_score)}>
                                {submission.image_quality_score ?? "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Anomaly:</span>
                              <span className={getScoreColor(100 - (submission.visual_anomaly_score ?? 0))}>
                                {submission.visual_anomaly_score ?? "-"}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Views:</span>
                              <span className="text-foreground">{submission.view_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Likes:</span>
                              <span className="text-foreground">{submission.like_count}</span>
                            </div>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* System Score */}
                        <div className="text-center sm:text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground mb-1">System Score</p>
                          <p
                            className={`text-2xl font-bold ${getScoreColor(
                              submission.system_score
                            )}`}
                          >
                            {submission.system_score?.toFixed(0) ?? "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfilePage;