import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Camera, 
  Shield, 
  Eye, 
  Banknote, 
  CheckCircle, 
  XCircle, 
  Scale, 
  Trash2, 
  Heart, 
  Sparkles,
  Users,
  Target
} from "lucide-react";

const HowGaalWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Platform Guide
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome to <span className="text-gradient">Gaal</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Gaal is a user-driven marketing platform where real people participate in brand campaigns, share authentic content, and get rewarded when that content creates value.
            </p>
            <p className="text-muted-foreground mt-4">
              This page explains, in simple terms, how participation works and how you earn.
            </p>
          </div>

          <div className="space-y-8">
            {/* Section 1 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      1. You Own Your Content
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Anything you create and share on Gaal — photos, videos, or experiences — belongs to you.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        We do not take ownership of your work.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        You can delete your content at any time.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      2. What Permission You Give Gaal
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      By participating in campaigns and sharing content, you give Gaal permission to:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        display your content on the Gaal platform
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        show it in search results (like Google)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        show previews to brands running campaigns
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        include it in campaigns you choose to enter
                      </li>
                    </ul>
                    <p className="text-muted-foreground mb-2">This permission is:</p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <strong className="text-foreground">non-exclusive</strong> (you can use your content elsewhere)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <strong className="text-foreground">revocable</strong> (you can remove your content)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      3. Brand Campaigns & Licensing
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Brands use Gaal to run participation campaigns. When you participate, your authentic content may be used in their marketing.
                    </p>
                    <p className="text-muted-foreground mb-2">When this happens:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        brands pay for usage rights through Gaal
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        Gaal manages the license on your behalf
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        you earn a share of the revenue
                      </li>
                    </ul>
                    <div className="p-4 rounded-lg bg-muted/50 mb-4">
                      <p className="text-foreground font-medium">
                        Your content is never sold. Only usage rights are licensed.
                      </p>
                    </div>
                    <p className="text-muted-foreground mb-2">You can choose whether your content is:</p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        campaign-only
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        brand-licensable
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        SEO-visible only
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      4. How You Earn
                    </h2>
                    <p className="text-muted-foreground mb-2">You can earn through:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        campaign rewards (cash, products, vouchers)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        brands licensing your content
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        recognition and portfolio building
                      </li>
                    </ul>
                    <p className="text-muted-foreground mb-2">Earnings depend on:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        content quality and authenticity
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        relevance to campaign goals
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        brand usefulness
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        real participation (not likes or followers)
                      </li>
                    </ul>
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-amber-600 dark:text-amber-400 font-medium">
                        There are no guaranteed payouts. Rewards depend on campaign participation and brand decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      5. Authentic Content Only
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Gaal is built on trust and real participation.
                    </p>
                    <p className="text-muted-foreground mb-2">You agree that:</p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        your content is real and original
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        you have the right to share it
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        it is not AI-generated
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        it is not stolen or copied
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      Fake or misleading content may be removed and accounts may be suspended.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive shrink-0">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      6. What Gaal Will NOT Do
                    </h2>
                    <p className="text-muted-foreground mb-4">Gaal will never:</p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        sell your personal data
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        sell your content without permission
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        use your content outside agreed licenses
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        force you into brand deals
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        lock your content forever
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        use AI-generated content or fake engagement
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 7 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      7. Quality & Selection
                    </h2>
                    <p className="text-muted-foreground mb-4">Gaal evaluates content based on:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        quality and authenticity
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        relevance to campaign goals
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        usefulness for brand marketing
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        human review and curation
                      </li>
                    </ul>
                    <p className="text-muted-foreground mb-2">We do not rank content by:</p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        follower count
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        popularity alone
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        virality
                      </li>
                    </ul>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-foreground font-medium">
                        Our goal is fairness and authentic participation — real people, real content.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 8 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      8. Content Removal
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      You can request removal of your content at any time:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        Contact our support team
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        We will remove it from Gaal's platform
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        If a brand is already using your content under a paid license, that license will continue until it ends — then the content is fully removed
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      We respect your right to control your content.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 9 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      9. Our Promise
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Gaal is built for real people, not influencers or AI.
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        No fake engagement
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        No influencer dependency
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        No AI-generated content
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        Real participation, real rewards
                      </li>
                    </ul>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-foreground font-medium">
                        Gaal — A user-driven marketing platform built on real participation.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 10 */}
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      10. Questions?
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      If anything is unclear, reach out to us at{' '}
                      <a href="mailto:support@wimira.com" className="text-primary hover:underline">
                        support@wimira.com
                      </a>
                    </p>
                    <p className="text-muted-foreground">
                      We're here to help you understand how Gaal works and make the most of your participation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowGaalWorks;
