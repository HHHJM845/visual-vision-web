import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ManagementSection from "@/components/ManagementSection";
import ArtworkCarousel from "@/components/ArtworkCarousel";
import SolutionSection from "@/components/SolutionSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import TestimonialsSection from "@/components/TestimonialsSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ManagementSection />
      <ArtworkCarousel />
      <SolutionSection />
      <FeaturesGrid />
      <TestimonialsSection />
    </div>
  );
};

export default Index;
