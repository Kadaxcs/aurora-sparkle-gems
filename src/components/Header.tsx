import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu,
  LogOut
} from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    // Verificar usuário logado
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchCartItemsCount(user.id);
      }
    };

    getUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCartItemsCount(session.user.id);
      } else {
        setCartItemsCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCartItemsCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId);

      if (error) throw error;
      
      const totalItems = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartItemsCount(totalItems);
    } catch (error) {
      console.error('Erro ao buscar itens do carrinho:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="w-full bg-secondary/30 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center">
              <span className="text-hero-bg font-bold text-sm">BA</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary">Bella Aurora</h1>
            <span className="text-xs text-muted-foreground hidden sm:block">JOIAS & SEMI-JOIAS</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Anéis</Link>
            <Link to="/products" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Brincos</Link>
            <Link to="/products" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Colares</Link>
            <Link to="/products" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Pulseiras</Link>
            <Link to="/products" className="text-sm font-medium text-foreground hover:text-gold transition-colors">Conjuntos</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon">
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
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
                {user.user_metadata?.role === 'admin' && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setAuthDialogOpen(true)}
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen} 
      />
      
      <CartSidebar 
        open={cartOpen} 
        onOpenChange={setCartOpen} 
        user={user}
      />
    </header>
  );
}