import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu,
  X
 } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { UserAccountDropdown } from "@/components/auth/UserAccountDropdown";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { SearchDialog } from "@/components/SearchDialog";
import { WishlistDialog } from "@/components/WishlistDialog";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";

export function Header() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { getTotalItems } = useCart(user);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    // Verificar usuário logado
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update cart count from hook
  useEffect(() => {
    const interval = setInterval(() => {
      setCartItemsCount(getTotalItems());
    }, 500);
    
    return () => clearInterval(interval);
  }, [getTotalItems]);


  return (
    <header className="w-full bg-white backdrop-blur-sm border-b border-border/50 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/0ee9c41c-0192-4940-9010-c5a7a36aa4ce.png" 
              alt="Bella Aurora Joias" 
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/aneis" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Anéis</Link>
            <Link to="/brincos" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Brincos</Link>
            <Link to="/colares" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Colares</Link>
            <Link to="/pulseiras" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Pulseiras</Link>
            <Link to="/conjuntos" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Conjuntos</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setWishlistOpen(true)}
            >
              <Heart className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {user ? (
              <UserAccountDropdown user={user} />
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setAuthDialogOpen(true)}
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-serif text-primary">Menu</SheetTitle>
                </SheetHeader>
                
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link 
                    to="/aneis" 
                    className="text-lg font-medium text-foreground hover:text-gold transition-colors py-3 border-b border-border/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Anéis
                  </Link>
                  <Link 
                    to="/brincos" 
                    className="text-lg font-medium text-foreground hover:text-gold transition-colors py-3 border-b border-border/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Brincos
                  </Link>
                  <Link 
                    to="/colares" 
                    className="text-lg font-medium text-foreground hover:text-gold transition-colors py-3 border-b border-border/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Colares
                  </Link>
                  <Link 
                    to="/pulseiras" 
                    className="text-lg font-medium text-foreground hover:text-gold transition-colors py-3 border-b border-border/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pulseiras
                  </Link>
                  <Link 
                    to="/conjuntos" 
                    className="text-lg font-medium text-foreground hover:text-gold transition-colors py-3 border-b border-border/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Conjuntos
                  </Link>
                  <Link 
                    to="/products" 
                    className="text-lg font-medium text-foreground hover:text-gold transition-colors py-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Todas as Joias
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen} 
      />
      
      <SearchDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen} 
      />
      
      <WishlistDialog 
        open={wishlistOpen} 
        onOpenChange={setWishlistOpen} 
        user={user}
      />
      
      <CartSidebar 
        open={cartOpen} 
        onOpenChange={setCartOpen} 
        user={user}
      />
    </header>
  );
}