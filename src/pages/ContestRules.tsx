import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const ContestRules = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-2">Contest Rules</h1>
          <p className="text-muted-foreground mb-8">Guidelines for fair and transparent competition</p>

          <Card className="glass-card mb-6">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 p-4 bg-success/10 border border-success/30 rounded-lg mb-6">
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-success mb-1">Skill-Based Contests Only</h3>
                  <p className="text-sm text-muted-foreground">
                    All Contestify contests are skill-based photography competitions. Winners are determined 
                    by the quality and creativity of their submissions, judged by human reviewers. 
                    There is NO element of chance or luck involved.
                  </p>
                </div>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Eligibility</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Open to all registered users aged 13 and above</li>
                  <li>One submission per user per contest</li>
                  <li>Users must have a verified email address</li>
                  <li>Employees and immediate family of Contestify are not eligible</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Entry Requirements</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>All entries are FREE - no purchase or payment required</li>
                  <li>Photos must be original works captured by the participant</li>
                  <li>Photos must be relevant to the contest theme (if specified)</li>
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
                  <li><strong>AI-Generated Images:</strong> Photos created using AI tools like Midjourney, DALL-E, Stable Diffusion, etc.</li>
                  <li><strong>Stock Photos:</strong> Images from stock photography websites</li>
                  <li><strong>Copied Images:</strong> Photos taken from the internet or other sources</li>
                  <li><strong>Heavy Manipulation:</strong> Significantly altered images that misrepresent reality</li>
                  <li><strong>Inappropriate Content:</strong> Nudity, violence, hate speech, or illegal content</li>
                  <li><strong>Copyright Violations:</strong> Images containing copyrighted material without permission</li>
                  <li><strong>Watermarked Images:</strong> Photos with visible watermarks from other platforms</li>
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
                <h2 className="text-2xl font-semibold mb-4">5. Judging Process</h2>
                <p className="text-muted-foreground mb-4">
                  Our judging process is transparent and skill-based:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Review Phase:</strong> All submissions undergo moderation for rule compliance</li>
                  <li><strong>Scoring:</strong> Approved entries are scored by admin judges based on:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Technical quality (composition, focus, exposure)</li>
                      <li>Creativity and originality</li>
                      <li>Relevance to theme</li>
                      <li>Emotional impact and storytelling</li>
                    </ul>
                  </li>
                  <li><strong>Winner Selection:</strong> The highest-scoring entry wins</li>
                  <li><strong>Human Review:</strong> Final decisions are always made by human judges, not algorithms</li>
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
                <h2 className="text-2xl font-semibold mb-4">7. Prizes</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Prize amounts are fixed and clearly displayed for each contest</li>
                  <li>Minimum 100 participants required for contest completion</li>
                  <li>Prizes are awarded to the winner after verification</li>
                  <li>Payouts require identity verification (KYC) if applicable</li>
                  <li>Tax responsibility lies with the winner</li>
                  <li>Prizes are non-transferable</li>
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
                  <li>Attempting to manipulate contest results</li>
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
                  By submitting a photo:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You retain full ownership of your photograph</li>
                  <li>You grant Contestify non-exclusive display rights for contest purposes</li>
                  <li>Your photo may be featured on our platform and promotional materials</li>
                  <li>You can request removal of your photos by contacting support</li>
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
