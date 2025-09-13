import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Search, Filter } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  images: any;
  slug: string;
  is_featured: boolean;
  category_id?: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [filterCategory, setFilterCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart(user);

  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    checkUser();
    fetchCategories();
    fetchProducts();
  }, [searchQuery, sortBy, filterCategory, priceRange]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('is_active', true);

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Apply category filter
      if (filterCategory && filterCategory !== "all") {
        query = query.eq('category_id', filterCategory);
      }

      // Apply price range filter
      if (priceRange && priceRange !== "all") {
        const [min, max] = priceRange.split('-').map(Number);
        query = query.gte('price', min);
        if (max) {
          query = query.lte('price', max);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar à lista de desejos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert([{
          user_id: user.id,
          product_id: productId,
        }]);

      if (error) {
        if (error.code === '23505') { // duplicate key error
          toast({
            title: "Item já adicionado",
            description: "Este item já está na sua lista de desejos",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Adicionado aos favoritos",
        description: "Item adicionado à sua lista de desejos",
      });
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar aos favoritos",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId);
  };

  const getPrice = (product: Product) => {
    return product.sale_price || product.price;
  };

  const getImageUrl = (product: Product) => {
    const images = product.images;
    if (images && Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return "/placeholder.svg";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">
            {searchQuery ? `Resultados para "${searchQuery}"` : "Nossos Produtos"}
          </h1>
          <p className="text-muted-foreground">
            Descubra nossa coleção exclusiva de joias e semi-joias
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-card rounded-lg border">
          <div className="flex-1">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Faixa de preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os preços</SelectItem>
                <SelectItem value="0-50">Até R$ 50</SelectItem>
                <SelectItem value="50-100">R$ 50 - R$ 100</SelectItem>
                <SelectItem value="100-200">R$ 100 - R$ 200</SelectItem>
                <SelectItem value="200-500">R$ 200 - R$ 500</SelectItem>
                <SelectItem value="500">Acima de R$ 500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome A-Z</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
                <SelectItem value="newest">Mais recentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou fazer uma nova busca
            </p>
            <Button onClick={() => {
              setFilterCategory("all");
              setPriceRange("all");
              setSortBy("name");
              navigate("/products");
            }}>
              Ver todos os produtos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  
                  {product.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-gold text-black">
                      Destaque
                    </Badge>
                  )}

                  {product.sale_price && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Promoção
                    </Badge>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => addToWishlist(product.id)}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {product.categories && (
                      <p className="text-xs text-muted-foreground">
                        {product.categories.name}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">
                        R$ {getPrice(product).toFixed(2)}
                      </span>
                      {product.sale_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <Button
                      className="w-full mt-2"
                      onClick={() => navigate(`/produto/${product.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}