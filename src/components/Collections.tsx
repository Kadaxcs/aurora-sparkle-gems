import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import earringsImg from "@/assets/earrings-collection.jpg";
import necklaceImg from "@/assets/necklace-collection.jpg";
import braceletsImg from "@/assets/bracelets-collection.jpg";

const collections = [
  {
    id: 1,
    title: "Brincos",
    subtitle: "Elegância em cada detalhe",
    image: earringsImg,
    items: "48+ peças",
    path: "/brincos",
  },
  {
    id: 2,
    title: "Colares",
    subtitle: "Charme e sofisticação",
    image: necklaceImg,
    items: "32+ peças",
    path: "/colares",
  },
  {
    id: 3,
    title: "Pulseiras",
    subtitle: "Delicadeza em ouro",
    image: braceletsImg,
    items: "24+ peças",
    path: "/pulseiras",
  },
];

export const Collections = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/50 border border-gold/20 mb-6">
            <span className="text-gold text-sm font-medium">✨ NOSSAS COLEÇÕES ✨</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
            Descubra Nossas
            <br />
            <span className="text-gold">Coleções Premium</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada peça é cuidadosamente selecionada para proporcionar elegância e exclusividade
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Card 
              key={collection.id} 
              className="group overflow-hidden bg-card border-border/50 shadow-elegant hover:shadow-luxury transition-luxury cursor-pointer"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-hero-bg/80 via-hero-bg/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Hover Content */}
                <div className="absolute inset-0 flex items-end justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Button 
                    className="mt-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    asChild
                  >
                    <Link to={collection.path}>Ver Coleção</Link>
                  </Button>
                </div>

                {/* Items Count Badge */}
                <div className="absolute top-4 right-4 bg-gold/90 backdrop-blur-sm text-hero-bg text-xs font-semibold px-3 py-1 rounded-full">
                  {collection.items}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-serif font-bold text-primary mb-2">
                  {collection.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {collection.subtitle}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-hero-bg" asChild>
            <Link to="/products">Ver Todas as Coleções</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};