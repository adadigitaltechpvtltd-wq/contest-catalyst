import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, Sparkles } from 'lucide-react';

const ContestRules = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Campaign Guidelines
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">Campaign Rules</h1>
          <p className="text-muted-foreground mb-8">Guidelines for fair and authentic participation</p>

          <Card className="glass-card mb-6">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 p-4 bg-success/10 border border-success/30 rounded-lg mb-6">
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-success mb-1">Authentic Participation Only</h3>
                  <p className="text-sm text-muted-foreground">
                    All Gaal campaigns are participation-based. Success is determined 
                    by the quality and authenticity of your contribution, reviewed by human curators. 
                    There is NO element of chance or luck involved.
                  </p>
                </div>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Eligibility</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Open to all registered users aged 18 and above</li>
                  <li>One submission per user per campaign</li>
                  <li>Users must have a verified email address</li>
                  <li>Employees and immediate family of Gaal are not eligible</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Entry Requirements</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>All entries are FREE - no purchase or payment required</li>
                  <li>Content must be original works created by the participant</li>
                  <li>Submissions must be relevant to the campaign theme (if specified)</li>
                  <li>Submissions must be in JPEG, PNG, or WebP format</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Participants must agree to the originality declaration</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-destructive" />
                  3. Prohibited Content
                </h2>
                <p className="text-muted-foreground mb-4">The following are strictly prohibited:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>AI-Generated Content:</strong> Content created using AI tools like Midjourney, DALL-E, Stable Diffusion, etc.</li>
                  <li><strong>Stock Content:</strong> Images from stock photography websites</li>
                  <li><strong>Copied Content:</strong> Content taken from the internet or other sources</li>
                  <li><strong>Heavy Manipulation:</strong> Significantly altered content that misrepresents reality</li>
                  <li><strong>Inappropriate Content:</strong> Nudity, violence, hate speech, or illegal content</li>
                  <li><strong>Copyright Violations:</strong> Content containing copyrighted material without permission</li>
                  <li><strong>Watermarked Content:</strong> Content with visible watermarks from other platforms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Allowed Editing</h2>
                <p className="text-muted-foreground mb-4">The following edits are permitted:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Basic adjustments: exposure, contrast, saturation, white balance</li>
                  <li>Cropping and straightening</li>
                  <li>Color grading and filters</li>
                  <li>Minor retouching (removing dust spots, blemishes)</li>
                  <li>Black and white conversion</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Review Process</h2>
                <p className="text-muted-foreground mb-4">
                  Our review process is transparent and quality-focused:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Moderation Phase:</strong> All submissions undergo moderation for rule compliance</li>
                  <li><strong>Quality Review:</strong> Approved entries are reviewed based on:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Authenticity and originality</li>
                      <li>Quality and relevance to campaign</li>
                      <li>Emotional impact and storytelling</li>
                      <li>Brand usefulness</li>
                    </ul>
                  </li>
                  <li><strong>Selection:</strong> Top contributions are selected for rewards</li>
                  <li><strong>Human Review:</strong> Final decisions are always made by human curators, not algorithms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  6. AI Detection Disclaimer
                </h2>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    We use automated AI detection tools to help identify potentially AI-generated content. 
                    However, please note:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>AI detection is provided on a <strong>best-effort basis</strong></li>
                    <li>No AI detection system is 100% accurate</li>
                    <li>False positives and false negatives may occur</li>
                    <li>AI detection is used to <strong>assist</strong> human review, not replace it</li>
                    <li><strong>Final authority rests with human reviewers</strong></li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Rewards</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Reward types and amounts are clearly displayed for each campaign</li>
                  <li>Rewards may include cash, products, vouchers, or recognition</li>
                  <li>Minimum participation thresholds may apply for campaign completion</li>
                  <li>Rewards are distributed after verification</li>
                  <li>Payouts require identity verification (KYC) if applicable</li>
                  <li>Tax responsibility lies with the recipient</li>
                  <li>Rewards are non-transferable</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Disqualification</h2>
                <p className="text-muted-foreground mb-4">
                  Submissions may be disqualified for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Violating any of the prohibited content rules</li>
                  <li>False declarations of originality</li>
                  <li>Submitting AI-generated content</li>
                  <li>Multiple account usage</li>
                  <li>Attempting to manipulate campaign results</li>
                  <li>Harassment of other participants</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Repeated violations may result in permanent account suspension.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Dispute Resolution</h2>
                <p className="text-muted-foreground mb-4">
                  If you believe a decision was made in error:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You may submit an appeal within 48 hours of the decision</li>
                  <li>Provide evidence supporting your claim</li>
                  <li>Appeals are reviewed by senior moderators</li>
                  <li>The final decision of the appeals process is binding</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Rights and Licensing</h2>
                <p className="text-muted-foreground mb-4">
                  By submitting content:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You retain full ownership of your content</li>
                  <li>You grant Gaal non-exclusive display rights for campaign purposes</li>
                  <li>Your content may be featured on our platform and in brand marketing materials</li>
                  <li>Brands may license your content for commercial use (you earn revenue)</li>
                  <li>You can request removal of your content by contacting support</li>
                </ul>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContestRules;
