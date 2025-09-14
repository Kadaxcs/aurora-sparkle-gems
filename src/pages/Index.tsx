import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Collections } from "@/components/Collections";
import FeaturedProducts from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";
import { usePreloadCriticalResources } from "@/hooks/usePerformance";
import { ImagePreloader } from "@/hooks/useImageOptimization";

const Index = () => {
  // Preload critical resources for performance
  usePreloadCriticalResources();

  return (
    <div className="min-h-screen bg-background">
      {/* Preload critical images */}
      <ImagePreloader srcs={[
        '/hero-ring.jpg',
        '/necklace-collection.jpg', 
        '/earrings-collection.jpg',
        '/bracelets-collection.jpg'
      ]} />
      
      <Header />
      <Hero />
      <FeaturedProducts />
      <Collections />
      <Footer />
    </div>
  );
};

export default Index;