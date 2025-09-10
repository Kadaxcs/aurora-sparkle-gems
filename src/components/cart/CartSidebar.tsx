import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    price: number;
    sale_price?: number;
    images: any;
  };
}

interface CartSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function CartSidebar({ open, onOpenChange, user }: CartSidebarProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && open) {
      fetchCartItems();
    }
  }, [user, open]);

  const fetchCartItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            name,
            price,
            sale_price,
            images
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== itemId));
      
      toast({
        title: "Produto removido",
        description: "O produto foi removido do carrinho",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto",
        variant: "destructive",
      });
    }
  };

  const getItemPrice = (item: CartItem) => {
    return item.products.sale_price || item.products.price;
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const getItemImage = (item: CartItem) => {
    const images = item.products.images;
    if (images && Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return null;
  };

  if (!user) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-serif text-primary">Carrinho</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Faça login para ver seus produtos no carrinho
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

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
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="font-semibold text-lg">
                  R$ {getTotal().toFixed(2)}
                </span>
              </div>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = '/checkout'}
              >
                Finalizar Compra
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}