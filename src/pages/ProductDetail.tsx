import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star,
  Minus,
  Plus,
  Truck,
  Shield,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { SizeGuide } from "@/components/SizeGuide";
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  description?: string;
  short_description?: string;
  sku?: string;
  stock_quantity: number;
  weight?: number;
  material?: string;
  images: any; // Json type from Supabase
  is_active: boolean;
  is_featured: boolean;
  dimensions?: any;
  available_sizes?: any;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  images: any;
}

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast({
        title: "Produto não encontrado",
        description: "O produto solicitado não foi encontrado",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const { addToCart } = useCart(user);

  const handleAddToCart = async () => {
    if (!product) return;

    // If product requires size, enforce it
    const requiresSize = product.available_sizes && Array.isArray(product.available_sizes) && product.available_sizes.length > 0;
    if (requiresSize && !selectedSize) {
      toast({
        title: "Tamanho necessário",
        description: "Selecione um tamanho antes de adicionar ao carrinho",
        variant: "destructive",
      });
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity, selectedSize || undefined);
      toast({
        title: "Produto adicionado!",
        description: "O produto foi adicionado ao seu carrinho",
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho (guest):', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // Buscar produtos relacionados com base no tipo no nome ou aleatoriamente
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      setLoadingRelated(true);
      try {
        let query = supabase
          .from('products')
          .select('id, name, price, sale_price, images')
          .eq('is_active', true)
          .neq('id', product.id)
          .limit(8);

        const name = product.name.toLowerCase();
        if (name.includes('anel')) query = query.ilike('name', '%anel%');
        else if (name.includes('brinc')) query = query.ilike('name', '%brinc%');
        else if (name.includes('colar')) query = query.ilike('name', '%colar%');
        else if (name.includes('pulseir')) query = query.ilike('name', '%pulseir%');

        const { data } = await query;
        setRelatedProducts(data || []);
      } catch (e) {
        console.error('Erro ao buscar relacionados:', e);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const currentPrice = product.sale_price || product.price;
  const hasDiscount = !!product.sale_price;
  const productImages = Array.isArray(product.images) ? product.images : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <button onClick={() => navigate("/")} className="hover:text-primary">
            Início
          </button>
          <span>/</span>
          <button onClick={() => navigate("/aneis")} className="hover:text-primary">
            Anéis
          </button>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
              {productImages && productImages.length > 0 ? (
                <>
                  <img 
                    src={productImages[selectedImage]} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <button className="absolute top-4 right-4 p-2 bg-white/80 rounded-full hover:bg-white">
                    <Share2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {productImages && productImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Título */}
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                {product.name}
              </h1>
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-primary">
                  R$ {currentPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through">
                    R$ {product.price.toFixed(2)}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Aceitamos PIX ou
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    Parcelamos em até 12x no Cartão s/ Juros
                  </span>
                </div>
              </div>
            </div>

            {/* Tamanho - apenas para anéis */}
            {product.available_sizes && 
             Array.isArray(product.available_sizes) && 
             product.available_sizes.length > 0 && 
             (product.name.toLowerCase().includes('anel') || product.name.toLowerCase().includes('anéis')) && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Tamanho:</label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha um tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.available_sizes.map((size: any) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantidade */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quantidade:</label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {product.stock_quantity <= 5 && (
                <p className="text-sm text-orange-600">
                  Apenas {product.stock_quantity} em estoque!
                </p>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={
                  addingToCart || 
                  product.stock_quantity === 0 || 
                  ((product.name.toLowerCase().includes('anel') || product.name.toLowerCase().includes('anéis')) && 
                   product.available_sizes && Array.isArray(product.available_sizes) && product.available_sizes.length > 0 && !selectedSize)
                }
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
              >
                {addingToCart ? (
                  "Adicionando..."
                ) : product.stock_quantity === 0 ? (
                  "Fora de Estoque"
                ) : ((product.name.toLowerCase().includes('anel') || product.name.toLowerCase().includes('anéis')) && 
                     product.available_sizes && Array.isArray(product.available_sizes) && product.available_sizes.length > 0 && !selectedSize) ? (
                  "Selecione um Tamanho"
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Adicionar ao Carrinho
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate('/checkout')}
                variant="default"
                className="w-full h-12 text-lg bg-accent hover:bg-accent/90"
                disabled={product.stock_quantity === 0}
              >
                Comprar Agora
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 text-lg"
              >
                <Heart className="h-5 w-5 mr-2" />
                Adicionar aos Favoritos
              </Button>
            </div>

            {/* Informações de Entrega */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Informações de Entrega
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Frete Simular:</span>
                    <span className="font-medium">Calcule o frete</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrega:</span>
                    <span className="font-medium">5-10 dias úteis</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Como Descobrir o Tamanho - apenas para anéis */}
            {(product.name.toLowerCase().includes('anel') || product.name.toLowerCase().includes('anéis')) && (
              <SizeGuide>
                <Button variant="outline" className="w-full">
                  COMO DESCOBRIR O TAMANHO
                </Button>
              </SizeGuide>
            )}
          </div>
        </div>

        {/* Detalhes do Produto */}
        <div className="space-y-8">
          <Separator />
          
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold mb-8 tracking-wider">
              D E T A L H E S
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Especificações Técnicas</h3>
                <div className="space-y-3 text-sm">
                  {product.weight && (
                    <div className="flex justify-between">
                      <span>Peso:</span>
                      <span className="font-medium">{product.weight}g</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Espessura:</span>
                    <span className="font-medium">0,4cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Banho:</span>
                    <span className="font-medium">10 Camadas de Ouro Branco (ródio)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pedra:</span>
                    <span className="font-medium">Zircônia</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tecnologia:</span>
                    <span className="font-medium">Antialérgica</span>
                  </div>
                  {product.material && (
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span className="font-medium">{product.material}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Garantias e Qualidade
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Ouro:</span>
                    <span className="font-medium">10 milésimos de ouro</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Garantia:</span>
                    <span className="font-medium">2 anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qualidade:</span>
                    <span className="font-medium">Certificado Hub Joias</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manutenção:</span>
                    <span className="font-medium">Limpeza gratuita</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resistência:</span>
                    <span className="font-medium">Antialérgica</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {product.description && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Produtos Relacionados */}
        <Separator className="my-12" />
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold mb-8">Você também pode gostar</h2>
        </div>
        {loadingRelated ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : relatedProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Sem recomendações no momento
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => {
              const images = Array.isArray(p.images) ? p.images : [];
              const img = images[0];
              const price = (p.sale_price || p.price) as number;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/produto/${p.id}`)}
                  className="cursor-pointer group border rounded-lg overflow-hidden bg-card"
                >
                  <div className="aspect-square overflow-hidden">
                    {img ? (
                      <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-medium line-clamp-2 mb-1">{p.name}</div>
                    <div className="text-primary font-semibold">R$ {price.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}