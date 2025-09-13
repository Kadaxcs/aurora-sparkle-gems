import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroRing from "@/assets/hero-ring.jpg";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroRing})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-luxury"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gold/20 backdrop-blur-sm border border-gold/30 mb-6">
          <span className="text-gold text-sm font-medium">✨ COLEÇÃO EXCLUSIVA ✨</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-hero-text mb-6">
          Anéis
          <br />
          <span className="text-gold">Encantadores</span>
        </h1>

        {/* Description */}
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-lg md:text-xl text-hero-text/90 leading-relaxed bg-hero-bg/30 backdrop-blur-sm rounded-lg p-6 border border-hero-text/10">
            Cada anel conta uma história única de elegância e sofisticação
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="luxury" 
            size="lg" 
            className="min-w-48"
            onClick={() => navigate('/aneis')}
          >
            DESCOBRIR ANÉIS
          </Button>
          <Button 
            variant="ghost-luxury" 
            size="lg" 
            className="min-w-48"
            onClick={() => navigate('/products')}
          >
            Ver Todas as Joias
          </Button>
        </div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 text-hero-text/80">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gold rounded-full"></div>
            <span className="text-sm">Frete Grátis acima de R$ 299</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gold rounded-full"></div>
            <span className="text-sm">12x sem juros</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gold rounded-full"></div>
            <span className="text-sm">Garantia de qualidade</span>
          </div>
        </div>
      </div>
    </section>
  );
};