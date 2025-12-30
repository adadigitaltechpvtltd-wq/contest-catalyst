import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Check, Rocket, Target, Users, MessageSquare, FileImage, 
  ArrowRight, Building2, Mail, Globe, Phone, XCircle,
  Sparkles, CheckCircle, BarChart3, DollarSign, Shield
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CountryCodeSelect, { detectCountryCode } from "@/components/CountryCodeSelect";

const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

const inquirySchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200, "Company name too long"),
  contact_name: z.string().trim().min(1, "Contact name is required").max(100, "Name too long"),
  email: z.string().trim().email("Valid email is required").max(255, "Email too long"),
  phone: z.string().trim()
    .min(1, "Phone number is required")
    .min(7, "Phone number must be at least 7 digits")
    .max(20, "Phone number too long")
    .regex(phoneRegex, "Please enter a valid phone number"),
  website: z.string().trim().url("Enter a valid URL").max(500, "URL too long").optional().or(z.literal("")),
  budget_range: z.string().optional(),
  message: z.string().trim().max(2000, "Message too long").optional().or(z.literal("")),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

const howItWorksSteps = [
  {
    icon: Target,
    title: "Define the Campaign",
    description: "Share your objective: product launch, brand awareness, audience engagement, or user feedback.",
  },
  {
    icon: Users,
    title: "We Activate Participants",
    description: "Gaal invites relevant users to participate by using or experiencing your product and sharing real feedback.",
  },
  {
    icon: BarChart3,
    title: "Campaign Runs at Scale",
    description: "Gaal manages participation flow, quality control, moderation, consent and usage rights.",
  },
  {
    icon: FileImage,
    title: "Receive Campaign Outcomes",
    description: "Get authentic content, honest feedback, organic reach, and assets ready for multi-channel use.",
  },
];

const outcomes = [
  "Large-scale real participation",
  "Authentic creatives that outperform polished ads",
  "Lower cost per creative",
  "Faster product validation",
  "Trust-building content",
  "Multi-channel reuse value",
];

const useCases = [
  "New product launches",
  "User trial and sampling campaigns",
  "D2C brands",
  "Tech, education, food, and lifestyle brands",
  "Brands seeking authentic user stories",
];

const whyGaal = [
  { icon: XCircle, text: "No influencer dependency", negative: true },
  { icon: XCircle, text: "No AI-generated content", negative: true },
  { icon: XCircle, text: "No fake engagement", negative: true },
  { icon: CheckCircle, text: "Fully managed campaigns", negative: false },
  { icon: CheckCircle, text: "Transparent pricing", negative: false },
  { icon: CheckCircle, text: "Rights-safe content", negative: false },
];

const budgetOptions = [
  { value: "under-500", label: "Under $500" },
  { value: "500-1000", label: "$500 - $1,000" },
  { value: "1000-2500", label: "$1,000 - $2,500" },
  { value: "2500-5000", label: "$2,500 - $5,000" },
  { value: "5000-plus", label: "$5,000+" },
  { value: "not-sure", label: "Not sure yet" },
];

const ForBrands = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countryCode, setCountryCode] = useState("+1");

  useEffect(() => {
    setCountryCode(detectCountryCode());
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  const scrollToForm = () => {
    document.getElementById("campaign-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("brand_inquiries").insert({
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: `${countryCode} ${data.phone}`,
        website: data.website || null,
        budget_range: data.budget_range || null,
        message: data.message,
      });

      if (error) throw error;

      setIsSubmitted(true);
      reset();
      setCountryCode(detectCountryCode());
      toast({
        title: "Inquiry submitted!",
        description: "Thanks for reaching out. Our team will contact you shortly.",
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="For Brands | Launch User-Driven Marketing Campaigns | Gaal"
        description="Launch large-scale, user-driven marketing campaigns with Gaal. Engage real users, collect authentic content, and build trust at scale. No influencers, no AI, just real participation."
      />
      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                For Brands & Businesses
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Launch Large-Scale, User-Driven{" "}
                <span className="text-gradient">Marketing Campaigns</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
                Gaal helps brands engage real users to participate in campaigns, share authentic content, and build trust — at scale.
              </p>

              <p className="text-muted-foreground mb-8">
                Not influencers. Not ads. <strong className="text-foreground">Real people, real experiences, real stories.</strong>
              </p>

              <Button size="lg" onClick={scrollToForm} className="group">
                Launch a Campaign
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* What Gaal Is */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                What is <span className="text-gradient">Gaal</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Gaal is a <strong className="text-foreground">participation-based marketing platform</strong> designed for brands that want authentic engagement at scale.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                {[
                  "Run product trial and experience campaigns",
                  "Collect real usage content and feedback",
                  "Build trust before scaling paid marketing",
                  "Create reusable marketing assets",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                How It Works for <span className="text-gradient">Brands</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {howItWorksSteps.map((step, index) => (
                <Card key={index} className="relative border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-8 pb-6">
                    <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What Brands Get */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  What Brands <span className="text-gradient">Get</span>
                </h2>
                <p className="text-xl text-muted-foreground">Outcomes, Not Just Content</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-foreground font-medium">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ideal Use Cases */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Ideal <span className="text-gradient">Use Cases</span>
                </h2>
                <p className="text-muted-foreground">Perfect for:</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {useCases.map((useCase, index) => (
                  <div 
                    key={index} 
                    className="px-5 py-3 bg-card border border-border rounded-full text-foreground font-medium"
                  >
                    {useCase}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Gaal */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Why <span className="text-gradient">Gaal</span>
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {whyGaal.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 p-4 rounded-xl border ${
                      item.negative 
                        ? "bg-destructive/5 border-destructive/20" 
                        : "bg-success/5 border-success/20"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.negative ? "text-destructive" : "text-success"}`} />
                    <span className="text-foreground font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-lg text-muted-foreground">
                  <strong className="text-foreground">Real participation beats paid promotion.</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Campaign Inquiry Form */}
        <section id="campaign-form" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Ready to Launch a <span className="text-gradient">Campaign</span>?
                </h2>
                <p className="text-muted-foreground">
                  Tell us your idea and we'll help you design a campaign that delivers real participation and real marketing impact.
                </p>
              </div>

              {isSubmitted ? (
                <Card className="border-success/50 bg-success/5">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      Thanks for reaching out!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Our team will contact you shortly to discuss your campaign.
                    </p>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                      Submit Another Inquiry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            Company / Brand Name *
                          </Label>
                          <Input
                            id="company_name"
                            placeholder="Your company or brand name"
                            {...register("company_name")}
                            className={errors.company_name ? "border-destructive" : ""}
                          />
                          {errors.company_name && (
                            <p className="text-sm text-destructive">{errors.company_name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contact_name" className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            Contact Person Name *
                          </Label>
                          <Input
                            id="contact_name"
                            placeholder="Your full name"
                            {...register("contact_name")}
                            className={errors.contact_name ? "border-destructive" : ""}
                          />
                          {errors.contact_name && (
                            <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            Business Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            {...register("email")}
                            className={errors.email ? "border-destructive" : ""}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            Phone Number *
                          </Label>
                          <div className="flex gap-2">
                            <CountryCodeSelect
                              value={countryCode}
                              onChange={setCountryCode}
                            />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="555 123 4567"
                              {...register("phone")}
                              className={`flex-1 ${errors.phone ? "border-destructive" : ""}`}
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          Website (Optional)
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://yourcompany.com"
                          {...register("website")}
                          className={errors.website ? "border-destructive" : ""}
                        />
                        {errors.website && (
                          <p className="text-sm text-destructive">{errors.website.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget_range">Budget Range (Optional)</Label>
                        <Select onValueChange={(value) => setValue("budget_range", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your budget range" />
                          </SelectTrigger>
                          <SelectContent>
                            {budgetOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          Campaign Idea / Message
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us about your brand and what kind of campaign you're envisioning..."
                          rows={5}
                          {...register("message")}
                          className={errors.message ? "border-destructive" : ""}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive">{errors.message.message}</p>
                        )}
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Campaign Inquiry"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ForBrands;
