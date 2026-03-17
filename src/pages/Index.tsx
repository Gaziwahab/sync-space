import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustBadges from "@/components/landing/TrustBadges";
import AgentFlowVisual from "@/components/landing/AgentFlowVisual";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <TrustBadges />
        <AgentFlowVisual />
        <FeatureShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
