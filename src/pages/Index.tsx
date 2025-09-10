import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Collections } from "@/components/Collections";
import { AdminAccess } from "@/components/AdminAccess";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Collections />
      <AdminAccess />
      <Footer />
    </div>
  );
};

export default Index;