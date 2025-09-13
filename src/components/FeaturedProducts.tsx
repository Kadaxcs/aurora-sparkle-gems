import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart, Sparkles, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  images: any[];
  short_description?: string;
  is_featured: boolean;
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(6);

      if (error) throw error;
      setProducts((data as any[]) || []);
    } catch (error: any) {
      console.error('Erro ao carregar produtos em destaque:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Login necessário",
          description: "Faça login para adicionar à lista de desejos",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('wishlist')
        .insert({ product_id: productId, user_id: user.id });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto adicionado à lista de desejos",
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Já na lista",
          description: "Este produto já está na sua lista de desejos",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar à lista de desejos",
          variant: "destructive",
        });
      }
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Login necessário",
          description: "Faça login para adicionar ao carrinho",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .insert({ 
          product_id: productId, 
          user_id: user.id,
          quantity: 1
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto adicionado ao carrinho",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar ao carrinho",
        variant: "destructive",
      });
    }
  };

  const calculateDiscount = (price: number, salePrice?: number) => {
    if (!salePrice) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-background via-background/50 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-background via-background/50 to-primary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">
              Produtos em Destaque
            </h2>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra nossa seleção especial de joias únicas, criadas com os melhores materiais e acabamento premium
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const discountPercentage = calculateDiscount(product.price, product.sale_price);
            const finalPrice = product.sale_price || product.price;
            
            return (
              <Card 
                key={product.id} 
                className="group hover:shadow-2xl transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="h-16 w-16" />
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge className="bg-primary text-primary-foreground font-semibold">
                          Destaque
                        </Badge>
                        {discountPercentage > 0 && (
                          <Badge variant="destructive" className="font-semibold">
                            -{discountPercentage}%
                          </Badge>
                        )}
                      </div>

                      {/* Wishlist button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToWishlist(product.id);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>

                      {/* Quick actions overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/product/${product.slug}`)}
                            className="backdrop-blur-sm"
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product.id);
                            }}
                            className="backdrop-blur-sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Comprar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {product.short_description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {product.short_description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {product.sale_price ? (
                              <>
                                <span className="text-lg font-bold text-foreground">
                                  R$ {product.sale_price.toFixed(2)}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  R$ {product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-foreground">
                                R$ {product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          {/* Rating stars */}
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="h-3 w-3 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">
                              (4.8)
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCart(product.id)}
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/products')}
            className="hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
          >
            Ver Todos os Produtos
          </Button>
        </div>
      </div>
    </section>
  );
}