import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ActiveContests from "@/components/ActiveContests";
import HowItWorks from "@/components/HowItWorks";
import Leaderboard from "@/components/Leaderboard";
import BrandsSection from "@/components/BrandsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ActiveContests />
      <HowItWorks />
      <Leaderboard />
      <BrandsSection />
      <Footer />
    </div>
  );
};

export default Index;