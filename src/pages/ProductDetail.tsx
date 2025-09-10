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
  images: any; // Json type from Supabase
  is_active: boolean;
  is_featured: boolean;
  dimensions?: any;
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

  const addToCart = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para adicionar produtos ao carrinho",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    setAddingToCart(true);
    try {
      // Verificar se já existe no carrinho
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (existingItem) {
        // Atualizar quantidade
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Adicionar novo item
        const { error } = await supabase
          .from('cart_items')
          .insert([{
            user_id: user.id,
            product_id: product.id,
            quantity: quantity
          }]);

        if (error) throw error;
      }

      toast({
        title: "Produto adicionado!",
        description: "O produto foi adicionado ao seu carrinho",
      });

    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

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
            {/* Título e SKU */}
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-muted-foreground text-sm">
                  SKU: {product.sku}
                </p>
              )}
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

            {/* Tamanho */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Tamanho:</label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha um tamanho" />
                </SelectTrigger>
                <SelectContent>
                  {[12, 14, 16, 18, 20, 22].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                onClick={addToCart}
                disabled={addingToCart || product.stock_quantity === 0}
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
              >
                {addingToCart ? (
                  "Adicionando..."
                ) : product.stock_quantity === 0 ? (
                  "Fora de Estoque"
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Comprar
                  </>
                )}
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

            {/* Como Descobrir o Tamanho */}
            <Button variant="outline" className="w-full">
              COMO DESCOBRIR O TAMANHO
            </Button>
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
                    <span>Material:</span>
                    <span className="font-medium">Ouro 18k</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pedras:</span>
                    <span className="font-medium">Zircônia</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acabamento:</span>
                    <span className="font-medium">Polido</span>
                  </div>
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
                    <span>Qualidade:</span>
                    <span className="font-medium">Certificado de qualidade</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Garantia:</span>
                    <span className="font-medium">2 anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manutenção:</span>
                    <span className="font-medium">Limpeza gratuita</span>
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
      </div>
    </div>
  );
}