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
  Sparkles 
} from "lucide-react";

const HowGaalWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome to GAAL
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              GAAL is a platform where real people share real moments — and get paid when those moments create value.
            </p>
            <p className="text-muted-foreground mt-4">
              This page explains, in simple terms, how your content is used and how you earn.
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
                      Anything you upload to GAAL — photos or videos — belongs to you.
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
                      2. What Permission You Give GAAL
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      By uploading content, you give GAAL permission to:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        display your content on the GAAL platform
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        show it in search results (like Google)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        show previews to brands
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        include it in contests you choose to enter
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
                      3. Brand Use & Licensing
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Some brands may want to use your content in ads, websites, or campaigns.
                    </p>
                    <p className="text-muted-foreground mb-2">When this happens:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        brands pay for usage rights
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        GAAL manages the license
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
                        contest-only
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
                        winning contests
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        brands licensing your content
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        views, downloads, or usage from search traffic
                      </li>
                    </ul>
                    <p className="text-muted-foreground mb-2">Earnings depend on:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        content quality
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        authenticity
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        brand usefulness
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        real usage (not likes or followers)
                      </li>
                    </ul>
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-amber-600 dark:text-amber-400 font-medium">
                        There are no guaranteed payouts.
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
                      GAAL is built on trust.
                    </p>
                    <p className="text-muted-foreground mb-2">You agree that:</p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        your content is real and original
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        you have the right to upload it
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
                      Fake or misleading content may be removed.
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
                      6. What GAAL Will NOT Do
                    </h2>
                    <p className="text-muted-foreground mb-4">GAAL will never:</p>
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
                      7. Visibility & Judging
                    </h2>
                    <p className="text-muted-foreground mb-4">GAAL uses a mix of:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        quality checks
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        authenticity checks
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        usefulness scoring
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        limited engagement signals
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
                        Our goal is fairness and long-term earning potential.
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
                      8. Removing Your Content
                    </h2>
                    <p className="text-muted-foreground mb-2">You can:</p>
                    <ul className="space-y-2 text-muted-foreground mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        delete your content
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        opt out of licensing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        leave the platform
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      If a brand is already using your content under a paid license, that license will continue until it ends — then the content is fully removed.
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
                      9. Respect & Safety
                    </h2>
                    <p className="text-muted-foreground mb-4">Content that includes:</p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        hate
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        abuse
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        illegal activity
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        explicit harm
                      </li>
                    </ul>
                    <p className="text-muted-foreground">will be removed.</p>
                    <p className="text-muted-foreground mt-4">
                      We want GAAL to be safe for creators and brands.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 10 */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      10. In Simple Words
                    </h2>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-3 text-foreground font-medium">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        You own your work
                      </li>
                      <li className="flex items-center gap-3 text-foreground font-medium">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        You choose how it's used
                      </li>
                      <li className="flex items-center gap-3 text-foreground font-medium">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        You get paid when it creates value
                      </li>
                    </ul>
                    <div className="p-4 rounded-lg bg-primary/10 mb-6">
                      <p className="text-foreground font-semibold">
                        GAAL exists to protect creators, not exploit them.
                      </p>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      If something feels unclear or unfair — contact us.
                    </p>
                    <p className="text-muted-foreground">
                      GAAL is built for the long term, with creators at the center.
                    </p>
                    <p className="mt-6 text-foreground font-semibold">
                      — Team GAAL
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
