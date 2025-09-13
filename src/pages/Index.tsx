import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Collections } from "@/components/Collections";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedProducts />
      <Collections />
      <Footer />
    </div>
  );
};

export default Index;