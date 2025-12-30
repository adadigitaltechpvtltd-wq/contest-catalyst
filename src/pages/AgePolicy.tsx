import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';

const AgePolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Eligibility Requirements
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">Age & Eligibility Policy</h1>
          <p className="text-muted-foreground mb-8">Understanding age requirements and participation eligibility</p>

          <Card className="glass-card mb-6">
            <CardContent className="p-8">
              {/* Key Summary */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-success mb-1">Minimum Age: 18 Years</h3>
                    <p className="text-sm text-muted-foreground">
                      You must be at least 18 years old to create an account and participate in campaigns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-amber-500 mb-1">Payout Age: 18 Years</h3>
                    <p className="text-sm text-muted-foreground">
                      You must be at least 18 years old to receive reward payouts directly.
                    </p>
                  </div>
                </div>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Age Requirements Overview</h2>
                <p className="text-muted-foreground mb-4">
                  Gaal has age requirements for different activities:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Activity</th>
                        <th className="text-left py-3 px-4 font-semibold">Minimum Age</th>
                        <th className="text-left py-3 px-4 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">Account Creation</td>
                        <td className="py-3 px-4">18 years</td>
                        <td className="py-3 px-4">Full access</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">Campaign Participation</td>
                        <td className="py-3 px-4">18 years</td>
                        <td className="py-3 px-4">Free to enter</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">Reward Eligibility</td>
                        <td className="py-3 px-4">18 years</td>
                        <td className="py-3 px-4">Can earn rewards</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">Direct Reward Payout</td>
                        <td className="py-3 px-4">18 years</td>
                        <td className="py-3 px-4">Full KYC required</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Users 18 Years and Above</h2>
                <p className="text-muted-foreground mb-4">
                  As an adult user (18+), you have:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Full access to all platform features</li>
                  <li>Ability to create an account and participate in all campaigns</li>
                  <li>Eligible for direct reward payouts</li>
                  <li>Can complete KYC verification independently</li>
                  <li>Responsible for tax obligations on earnings</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Age Verification Process</h2>
                <p className="text-muted-foreground mb-4">
                  We verify age through the following methods:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>At Registration:</strong> Date of birth declaration</li>
                  <li><strong>At Payout:</strong> Government ID verification (KYC)</li>
                </ul>
                <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-4">
                  <Info className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">
                    Providing false age information is a violation of our terms and may result in 
                    account suspension and forfeiture of earnings.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Payout Process</h2>
                <p className="text-muted-foreground mb-4">
                  For reward recipients, the payout process is:
                </p>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>User is notified of their reward</li>
                  <li>Reward amount is added to the Gaal wallet</li>
                  <li>User submits payout request</li>
                  <li>User completes KYC verification</li>
                  <li>Payout is processed to verified account</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Users Under 18</h2>
                <div className="flex items-start gap-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-muted-foreground">
                      Gaal is <strong>NOT</strong> available to users under 18 years of age. 
                      We do not knowingly collect information from minors. If we become 
                      aware that we have collected personal information from someone under 18, we 
                      will delete that information immediately.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Tax Considerations</h2>
                <p className="text-muted-foreground mb-4">
                  Regarding taxes on reward earnings:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Recipients are responsible for any applicable taxes</li>
                  <li>Consult a tax professional for guidance on reporting requirements</li>
                  <li>Gaal may provide documentation for tax purposes upon request</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  For any questions about our age policy, contact us at:{' '}
                  <a href="mailto:support@gaal.com" className="text-primary hover:underline">
                    support@gaal.com
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AgePolicy;
