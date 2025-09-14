import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  images: any;
  short_description?: string;
  is_featured: boolean;
  category_id?: string;
}

export default function Bracelets() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const { addToCart } = useCart(user);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Filtrar por categoria "pulseiras"
      query = query.ilike('name', '%pulseira%');

      // Ordenação
      if (sortBy === "price_asc") {
        query = query.order('price', { ascending: true });
      } else if (sortBy === "price_desc") {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar pulseiras:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as pulseiras",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      toast({ title: "Produto adicionado", description: "A pulseira foi adicionada ao carrinho" });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({ title: "Erro", description: "Não foi possível adicionar a pulseira ao carrinho", variant: "destructive" });
    }
  };

  const getProductImage = (product: Product) => {
    const images = product.images;
    if (images && Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return "/placeholder.svg";
  };

  const getProductPrice = (product: Product) => {
    return product.sale_price || product.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 py-16 bg-gradient-luxury rounded-lg">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Pulseiras Delicadas
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Delicadeza em ouro que adornam seus pulsos com elegância
          </p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-serif text-foreground">Coleção de Pulseiras</h2>
            <p className="text-muted-foreground">
              {products.length} pulseira{products.length !== 1 ? 's' : ''} encontrada{products.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="price_asc">Menor Preço</SelectItem>
                <SelectItem value="price_desc">Maior Preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Nenhuma pulseira encontrada
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="group hover:shadow-elegant transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/produto/${product.id}`)}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.sale_price && (
                      <Badge className="absolute top-3 left-3 bg-destructive">
                        Oferta
                      </Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="absolute top-3 right-3 bg-primary">
                        Destaque
                      </Badge>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                      <Button variant="secondary" size="sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleAddToCart(product.id)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <h3 className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.short_description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-primary">
                          R$ {getProductPrice(product).toFixed(2)}
                        </div>
                        {product.sale_price && (
                          <div className="text-sm text-muted-foreground line-through">
                            R$ {product.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => addToCart(product.id)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}