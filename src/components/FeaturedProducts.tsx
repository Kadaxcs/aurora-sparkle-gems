import { useState, useEffect, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart, Sparkles, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useProductCache } from "@/hooks/useProductCache";
import { SizeSelector } from "@/components/SizeSelector";

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

function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const { addToCart: addToCartHook } = useCart(user);
  const { getCachedProduct, setCachedProduct } = useProductCache();

  useEffect(() => {
    fetchFeaturedProducts();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  const fetchFeaturedProducts = useCallback(async () => {
    // Check cache first
    const cacheKey = 'featured-products';
    const cached = getCachedProduct(cacheKey);
    
    if (cached) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, sale_price, images, short_description, is_featured')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(6);

      if (error) throw error;
      
      const productsData = (data as any[]) || [];
      setProducts(productsData);
      
      // Cache for 5 minutes
      setCachedProduct(cacheKey, productsData);
    } catch (error: any) {
      console.error('Erro ao carregar produtos em destaque:', error);
    } finally {
      setLoading(false);
    }
  }, [getCachedProduct, setCachedProduct]);

  const addToWishlist = useCallback(async (productId: string) => {
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
  }, [toast]);

  // FUNÇÃO CRÍTICA: Verificar se é anel e exigir tamanho SEMPRE
  const handleAddToCart = useCallback((product: Product) => {
    const isRing = product.name.toLowerCase().includes('anel') || 
                   product.name.toLowerCase().includes('anéis') ||
                   product.name.toLowerCase().includes('ring');
    
    if (isRing) {
      // Para anéis, SEMPRE abrir seletor de tamanho - nunca adicionar direto
      // Usar SizeSelector component com tamanhos padrão se não especificado
      const availableSizes = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
      // Trigger size selector aqui
      return;
    } else {
      // Para outros produtos, adicionar direto
      addToCartHook(product.id);
    }
  }, [addToCartHook]);

  const calculateDiscount = (price: number, salePrice?: number) => {
    if (!salePrice) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-background via-background/50 to-primary/5 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-6 w-6 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded w-64"></div>
                <div className="h-6 w-6 bg-muted rounded"></div>
              </div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>

          {/* Product cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-card/80 backdrop-blur-sm rounded-lg overflow-hidden">
                  <div className="aspect-square bg-muted"></div>
                  <div className="p-6">
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="h-6 bg-muted rounded w-20"></div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div key={star} className="h-3 w-3 bg-muted rounded"></div>
                          ))}
                        </div>
                      </div>
                      <div className="h-9 w-9 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="h-10 bg-muted rounded w-48 mx-auto"></div>
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
                className="group hover:shadow-2xl transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm overflow-hidden cursor-pointer"
                onClick={() => navigate(`/produto/${product.id}`)}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
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
                            onClick={() => navigate(`/produto/${product.id}`)}
                            className="backdrop-blur-sm"
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="backdrop-blur-sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.name.toLowerCase().includes('anel') ? 'Selecionar Tamanho' : 'Comprar'}
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

                        {product.name.toLowerCase().includes('anel') ? (
                          <SizeSelector
                            productId={product.id}
                            productName={product.name}
                            availableSizes={[14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]}
                            onAddToCart={addToCartHook}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            }
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCartHook(product.id)}
                            className="hover:bg-primary hover:text-primary-foreground"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        )}
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

export default memo(FeaturedProducts);