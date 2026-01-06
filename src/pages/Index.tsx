import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhatIsGaal from "@/components/home/WhatIsGaal";
import WhyPeopleJoin from "@/components/home/WhyPeopleJoin";
import WhyBrandsUse from "@/components/home/WhyBrandsUse";
import HowItWorks from "@/components/HowItWorks";
import ActiveCampaigns from "@/components/ActiveCampaigns";
import TrustSection from "@/components/home/TrustSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <WhatIsGaal />
      <WhyPeopleJoin />
      <WhyBrandsUse />
      <HowItWorks />
      <ActiveCampaigns />
      <TrustSection />
      <Footer />
    </div>
  );
};

export default Index;
