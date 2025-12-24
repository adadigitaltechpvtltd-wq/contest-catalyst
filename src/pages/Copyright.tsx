import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Copyright = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-2">Copyright Policy</h1>
          <p className="text-muted-foreground mb-8">Protecting creative works and intellectual property</p>

          <Card className="glass-card">
            <CardContent className="p-8 prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Ownership of Submitted Content</h2>
                <p className="text-muted-foreground mb-4">
                  At Gaal, we respect the intellectual property rights of photographers and creators:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>You retain full ownership</strong> of all photographs you submit</li>
                  <li>Gaal does not claim ownership of user-submitted content</li>
                  <li>Your copyright remains with you at all times</li>
                  <li>We do not sell or license your photographs to third parties</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. License Granted to Contestify</h2>
                <p className="text-muted-foreground mb-4">
                  By submitting a photograph to our contests, you grant Gaal a limited license to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Display your photo on our platform for contest purposes</li>
                  <li>Feature your photo in our gallery of submissions</li>
                  <li>Use your photo in promotional materials (with attribution)</li>
                  <li>Create thumbnails and resized versions for display</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  This license is:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Non-exclusive:</strong> You can use and license your photo elsewhere</li>
                  <li><strong>Royalty-free:</strong> No fees are charged for this display license</li>
                  <li><strong>Revocable:</strong> You can request removal at any time</li>
                  <li><strong>Limited:</strong> Only for display and promotional purposes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Your Responsibilities</h2>
                <p className="text-muted-foreground mb-4">
                  When submitting photographs, you represent and warrant that:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You are the original creator of the photograph</li>
                  <li>You own all rights to the photograph</li>
                  <li>The photograph does not infringe on any third-party rights</li>
                  <li>You have obtained necessary releases for identifiable people or private property</li>
                  <li>You have the authority to grant the license described above</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Copyright Infringement</h2>
                <p className="text-muted-foreground mb-4">
                  We take copyright infringement seriously. The following are strictly prohibited:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Submitting photographs you did not take</li>
                  <li>Using stock images from any source</li>
                  <li>Copying images from the internet</li>
                  <li>Using images without proper licensing</li>
                  <li>Removing watermarks or credits from images</li>
                  <li>Submitting AI-generated images as original photographs</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. DMCA Takedown Process</h2>
                <p className="text-muted-foreground mb-4">
                  If you believe your copyrighted work has been infringed, please submit a DMCA takedown notice containing:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Your contact information (name, email, phone)</li>
                  <li>Description of the copyrighted work claimed to be infringed</li>
                  <li>URL or location of the infringing material on our platform</li>
                  <li>A statement that you have a good faith belief the use is unauthorized</li>
                  <li>A statement, under penalty of perjury, that the information is accurate</li>
                  <li>Your physical or electronic signature</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Send DMCA notices to:{' '}
                  <a href="mailto:dmca@gaal.com" className="text-primary hover:underline">
                    dmca@gaal.com
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Counter-Notification</h2>
                <p className="text-muted-foreground mb-4">
                  If you believe your content was wrongly removed, you may submit a counter-notification containing:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Your contact information</li>
                  <li>Identification of the removed material and its location</li>
                  <li>A statement under penalty of perjury that removal was a mistake</li>
                  <li>Consent to jurisdiction and agreement to accept service of process</li>
                  <li>Your physical or electronic signature</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Repeat Infringer Policy</h2>
                <p className="text-muted-foreground mb-4">
                  We maintain a policy for handling repeat infringers:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>First offense: Content removal and warning</li>
                  <li>Second offense: Content removal and temporary suspension</li>
                  <li>Third offense: Permanent account termination</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Model and Property Releases</h2>
                <p className="text-muted-foreground mb-4">
                  When submitting photographs featuring:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Identifiable People:</strong> Ensure you have appropriate model releases</li>
                  <li><strong>Private Property:</strong> Ensure you have permission to photograph</li>
                  <li><strong>Trademarks:</strong> Be cautious of prominent branded content</li>
                  <li><strong>Artwork:</strong> Respect copyright of art, architecture, and designs</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Removal Requests</h2>
                <p className="text-muted-foreground mb-4">
                  You may request removal of your photographs at any time:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Contact our support team with your request</li>
                  <li>Provide proof of ownership if requested</li>
                  <li>Allow up to 7 business days for processing</li>
                  <li>Note: Removal may affect your participation in ongoing contests</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
                <p className="text-muted-foreground">
                  For copyright-related inquiries, please contact:{' '}
                  <a href="mailto:copyright@gaal.com" className="text-primary hover:underline">
                    copyright@gaal.com
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

export default Copyright;
