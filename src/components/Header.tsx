import { Button } from "@/components/ui/button";
import { Heart, Search, ShoppingBag, User } from "lucide-react";

export const Header = () => {
  return (
    <header className="w-full bg-secondary/30 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center">
              <span className="text-hero-bg font-bold text-sm">BA</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary">Bella Aurora</h1>
            <span className="text-xs text-muted-foreground hidden sm:block">JOIAS & SEMI-JOIAS</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Anéis</a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Brincos</a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Colares</a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Pulseiras</a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Conjuntos</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};