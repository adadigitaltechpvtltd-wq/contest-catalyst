import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Camera, Handshake, FileImage, Sparkles, ArrowRight, Building2, Mail, Globe, MessageSquare, User, Phone } from "lucide-react";
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
    icon: MessageSquare,
    title: "Submit Your Campaign Idea",
    description: "Tell us about your brand and the kind of content you're looking for.",
  },
  {
    icon: Handshake,
    title: "We Review & Connect",
    description: "Our team reviews your inquiry and reaches out to discuss the details.",
  },
  {
    icon: Camera,
    title: "Gaal Manages the Contest",
    description: "We create, launch, and manage the entire photo contest for you.",
  },
  {
    icon: FileImage,
    title: "Receive Authentic Content",
    description: "Get real, human-made photos from engaged creators — ready to use.",
  },
];

const benefits = [
  "Real user-generated content from real people",
  "Fixed pricing and transparent rules",
  "Manual human curation — no AI-generated content",
  "Rights-safe content with creator consent",
  "Campaigns managed end-to-end by Gaal",
  "Access to engaged photography community",
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
    document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" });
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
        title="For Brands | Launch Authentic Photo Contests | Gaal"
        description="Partner with Gaal to launch sponsored photo contests and generate real user-generated content from engaged creators. No AI, no fake content — just authentic human photography."
      />
      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                For Brands & Businesses
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Launch Authentic Photo Contests{" "}
                <span className="text-gradient">With Real Creators</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Gaal helps brands generate real, human-made photography through skill-based contests — no AI, no fake content, no influencer noise. Just authentic engagement.
              </p>

              <Button size="lg" onClick={scrollToForm} className="group">
                Partner With Us
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                How It Works for Brands
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A simple, hands-off process to get authentic user-generated content.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {howItWorksSteps.map((step, index) => (
                <Card key={index} className="relative border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mt-2">
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
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  What You Get With Gaal
                </h2>
                <p className="text-muted-foreground mb-8">
                  We handle everything so you can focus on your brand. From contest creation to content delivery — it's all managed by our team.
                </p>

                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-primary/20 via-orange-500/10 to-background rounded-2xl p-8 border border-border">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      Ready to get started?
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Submit your inquiry below and our team will get back to you within 24-48 hours.
                    </p>
                    <Button onClick={scrollToForm} variant="outline">
                      Go to Form
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Form */}
        <section id="partner-form" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Partner With Us
                </h2>
                <p className="text-muted-foreground">
                  Tell us about your brand and campaign idea. We'll get back to you shortly.
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
                            <User className="w-4 h-4 text-muted-foreground" />
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
                          placeholder="Tell us about your brand and what kind of photo contest you're envisioning..."
                          rows={5}
                          {...register("message")}
                          className={errors.message ? "border-destructive" : ""}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive">{errors.message.message}</p>
                        )}
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Inquiry"}
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