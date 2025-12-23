import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AgePolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-2">Age & Eligibility Policy</h1>
          <p className="text-muted-foreground mb-8">Understanding age requirements and restrictions</p>

          <Card className="glass-card mb-6">
            <CardContent className="p-8">
              {/* Key Summary */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-success mb-1">Minimum Age: 13 Years</h3>
                    <p className="text-sm text-muted-foreground">
                      You must be at least 13 years old to create an account and participate in contests.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-amber-500 mb-1">Payout Age: 18 Years</h3>
                    <p className="text-sm text-muted-foreground">
                      You must be at least 18 years old to receive prize payouts directly.
                    </p>
                  </div>
                </div>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Age Requirements Overview</h2>
                <p className="text-muted-foreground mb-4">
                  Contestify has different age requirements for different activities:
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
                        <td className="py-3 px-4">13 years</td>
                        <td className="py-3 px-4">Parental consent recommended</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">Contest Participation</td>
                        <td className="py-3 px-4">13 years</td>
                        <td className="py-3 px-4">Free to enter</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">Prize Eligibility</td>
                        <td className="py-3 px-4">13 years</td>
                        <td className="py-3 px-4">Can win prizes</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">Direct Prize Payout</td>
                        <td className="py-3 px-4">18 years</td>
                        <td className="py-3 px-4">Full KYC required</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">Minor Prize Payout</td>
                        <td className="py-3 px-4">13-17 years</td>
                        <td className="py-3 px-4">Requires guardian</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Users Under 18 Years</h2>
                <p className="text-muted-foreground mb-4">
                  If you are between 13 and 17 years old:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You can create an account and participate in all contests</li>
                  <li>You can submit photographs and compete for prizes</li>
                  <li>If you win, your prize will be held in your Contestify wallet</li>
                  <li>Prize payouts require a parent or legal guardian to:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Provide their identity verification</li>
                      <li>Authorize the payout on your behalf</li>
                      <li>Receive the payout to their verified account</li>
                    </ul>
                  </li>
                  <li>We recommend parental supervision for all activities</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Users 18 Years and Above</h2>
                <p className="text-muted-foreground mb-4">
                  If you are 18 years or older:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Full access to all platform features</li>
                  <li>Eligible for direct prize payouts</li>
                  <li>Can complete KYC verification independently</li>
                  <li>Responsible for tax obligations on winnings</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Age Verification Process</h2>
                <p className="text-muted-foreground mb-4">
                  We verify age through the following methods:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>At Registration:</strong> Date of birth declaration</li>
                  <li><strong>At Payout:</strong> Government ID verification (KYC)</li>
                  <li><strong>For Minors:</strong> Guardian identity verification</li>
                </ul>
                <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-4">
                  <Info className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">
                    Providing false age information is a violation of our terms and may result in 
                    account suspension and forfeiture of winnings.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Minor Payout Process</h2>
                <p className="text-muted-foreground mb-4">
                  For winners aged 13-17, the payout process is:
                </p>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>Winner is notified of their prize</li>
                  <li>Prize amount is held in the Contestify wallet</li>
                  <li>Parent/guardian submits payout request</li>
                  <li>Parent/guardian completes KYC verification</li>
                  <li>Parent/guardian provides proof of relationship</li>
                  <li>Payout is processed to guardian account</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Parental Consent</h2>
                <p className="text-muted-foreground mb-4">
                  While we do not require explicit parental consent for account creation (for users 13+), 
                  we strongly recommend:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Parents review and approve their child account creation</li>
                  <li>Parents monitor their child activity on the platform</li>
                  <li>Parents discuss safe online behavior with their children</li>
                  <li>Parents contact us with any concerns about their child account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Children Under 13</h2>
                <div className="flex items-start gap-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-muted-foreground">
                      Contestify is <strong>NOT</strong> available to users under 13 years of age. 
                      We do not knowingly collect information from children under 13. If we become 
                      aware that we have collected personal information from a child under 13, we 
                      will delete that information immediately.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Tax Considerations</h2>
                <p className="text-muted-foreground mb-4">
                  Regarding taxes on prize winnings:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Winners are responsible for any applicable taxes</li>
                  <li>For minors, the parent/guardian is responsible for tax reporting</li>
                  <li>Consult a tax professional for guidance on reporting requirements</li>
                  <li>Contestify may provide documentation for tax purposes upon request</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Contact for Parents</h2>
                <p className="text-muted-foreground mb-4">
                  Parents and guardians can contact us for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Questions about their child account</li>
                  <li>Requesting removal of a child account</li>
                  <li>Payout assistance for minor winners</li>
                  <li>Any concerns about child safety</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Contact us at:{' '}
                  <a href="mailto:parents@contestify.com" className="text-primary hover:underline">
                    parents@contestify.com
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
