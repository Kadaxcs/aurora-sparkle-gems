import { useState, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    sale_price?: number;
    images: any;
    slug: string;
  };
}

interface WishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function WishlistDialog({ open, onOpenChange, user }: WishlistDialogProps) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchWishlistItems();
    }
  }, [open, user]);

  const fetchWishlistItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          products (
            id,
            name,
            price,
            sale_price,
            images,
            slug
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar lista de desejos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar sua lista de desejos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Removido",
        description: "Item removido da lista de desejos",
      });
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        variant: "destructive",
      });
    }
  };

  const getPrice = (item: WishlistItem) => {
    return item.products.sale_price || item.products.price;
  };

  const getImageUrl = (item: WishlistItem) => {
    const images = item.products.images;
    if (images && Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return "/placeholder.svg";
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Lista de Desejos
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Faça login para ver sua lista de desejos
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Fazer Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Lista de Desejos ({wishlistItems.length})
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Sua lista de desejos está vazia
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(item)}
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {item.products.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-primary">
                          R$ {getPrice(item).toFixed(2)}
                        </span>
                        {item.products.sale_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {item.products.price.toFixed(2)}
                          </span>
                        )}
                        {item.products.sale_price && (
                          <Badge variant="secondary" className="text-xs">
                            Promoção
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `/produto/${item.products.id}`;
                          onOpenChange(false);
                        }}
                      >
                        Ver Produto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}