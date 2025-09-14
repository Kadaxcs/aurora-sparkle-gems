import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { AuthDialog } from "@/components/auth/AuthDialog";

interface CartSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function CartSidebar({ open, onOpenChange, user }: CartSidebarProps) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const {
    cartItems,
    loading,
    updateQuantity,
    removeItem,
    getItemPrice,
    getTotal,
    migrateLocalCartToUser
  } = useCart(user);

  // Migrate local cart when user logs in - with improved timing
  useEffect(() => {
    if (user?.id && cartItems.length === 0) {
      // Small delay to ensure user state is stable
      const timer = setTimeout(() => {
        migrateLocalCartToUser();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id, migrateLocalCartToUser]);

  // Refresh cart when sidebar opens (ensures guest cart sync)
  useEffect(() => {
    if (open) {
      try { window.dispatchEvent(new CustomEvent('cart:updated')); } catch {}
    }
  }, [open]);

  const getItemImage = (item: any) => {
    const images = item.products.images;
    if (images && Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return null;
  };

  // Show cart content for both logged in and guest users
  const showLoginPrompt = !user && cartItems.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-primary">
            Carrinho {cartItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {cartItems.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : showLoginPrompt ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Faça login para sincronizar seu carrinho
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Você pode adicionar produtos mesmo sem login
            </p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Seu carrinho está vazio
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                    {getItemImage(item) && (
                      <img 
                        src={getItemImage(item)} 
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium text-sm">{item.products.name}</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">
                          R$ {getItemPrice(item).toFixed(2)}
                        </span>
                        {item.products.sale_price && (
                          <span className="text-muted-foreground line-through ml-2">
                            R$ {item.products.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Frete:</span>
                  <span>Calculado no checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="font-semibold text-lg text-primary">
                    R$ {getTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                  onClick={() => {
                    if (!user) {
                      setAuthDialogOpen(true);
                      return;
                    }
                    onOpenChange(false);
                    window.location.href = '/checkout';
                  }}
                >
                  {user ? 'Finalizar Compra' : 'Login para Finalizar'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    window.location.href = '/products';
                  }}
                >
                  Continuar Comprando
                </Button>
              </div>
            </div>
          </>
        )}
        
        <AuthDialog 
          open={authDialogOpen} 
          onOpenChange={(open) => {
            setAuthDialogOpen(open);
            // Fechar o carrinho após login bem-sucedido
            if (!open && user) {
              onOpenChange(false);
            }
          }}
          title="Login ou Registro para Finalizar"
          description="Entre na sua conta ou crie uma nova para finalizar sua compra"
        />
      </SheetContent>
    </Sheet>
  );
}