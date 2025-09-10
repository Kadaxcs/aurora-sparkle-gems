import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  User, 
  Package,
  Truck 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    sale_price?: number;
    images: any;
  };
}

interface CheckoutData {
  // Dados pessoais
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Endereço
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Pagamento
  paymentMethod: "credit_card" | "pix" | "boleto";
  
  // Observações
  notes: string;
}

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "credit_card",
    notes: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadCart();
  }, []);

  const checkAuthAndLoadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para acessar o checkout",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setUser(user);
      
      // Carregar dados do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setCheckoutData(prev => ({
          ...prev,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: user.email || "",
          phone: profile.phone || "",
        }));
      }

      // Carregar itens do carrinho
      const { data: cartData, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            sale_price,
            images
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (!cartData || cartData.length === 0) {
        toast({
          title: "Carrinho vazio",
          description: "Adicione produtos ao carrinho antes de finalizar a compra",
        });
        navigate("/");
        return;
      }

      setCartItems(cartData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do checkout",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item: CartItem) => {
    return item.products.sale_price || item.products.price;
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const getShippingCost = () => {
    // Frete fixo por enquanto
    return 15.00;
  };

  const getTotal = () => {
    return getSubtotal() + getShippingCost();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validações básicas
      if (!checkoutData.firstName || !checkoutData.lastName || !checkoutData.email) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      if (!checkoutData.street || !checkoutData.city || !checkoutData.zipCode) {
        throw new Error("Preencha o endereço completo");
      }

      // Criar pedido no banco primeiro
      const order = await createOrder();

      // Redirecionar para MercadoPago
      await createMercadoPagoPayment(order);

    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: "Erro no checkout",
        description: error.message || "Não foi possível processar seu pedido",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const createOrder = async () => {
    // Criar pedido
    const orderData = {
      user_id: user.id,
      status: 'pending' as const,
      payment_status: 'pending' as const,
      payment_method: checkoutData.paymentMethod,
      subtotal: getSubtotal(),
      shipping_cost: getShippingCost(),
      total: getTotal(),
      order_number: `ORD-${Date.now()}`,
      shipping_address: {
        street: checkoutData.street,
        number: checkoutData.number,
        complement: checkoutData.complement,
        neighborhood: checkoutData.neighborhood,
        city: checkoutData.city,
        state: checkoutData.state,
        zip_code: checkoutData.zipCode,
      },
      billing_address: {
        street: checkoutData.street,
        number: checkoutData.number,
        complement: checkoutData.complement,
        neighborhood: checkoutData.neighborhood,
        city: checkoutData.city,
        state: checkoutData.state,
        zip_code: checkoutData.zipCode,
      },
      notes: checkoutData.notes,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Criar itens do pedido
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: getItemPrice(item),
      total: getItemPrice(item) * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Limpar carrinho
    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (clearCartError) throw clearCartError;

    // Enviar pedido para Loja Integrada
    try {
      await supabase.functions.invoke('create-order-loja-integrada', {
        body: { orderId: order.id }
      });
      console.log('Pedido enviado para Loja Integrada');
    } catch (lojaError) {
      console.warn('Erro ao enviar para Loja Integrada:', lojaError);
      // Não falha o checkout se a integração com Loja Integrada falhar
    }

    return order;
  };

  const createMercadoPagoPayment = async (order: any) => {
    try {
      // Preparar dados para MercadoPago
      const items = cartItems.map(item => ({
        title: item.products.name,
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        currency_id: "BRL",
      }));

      const paymentData = {
        items,
        payer: {
          name: checkoutData.firstName,
          surname: checkoutData.lastName,
          email: checkoutData.email,
          phone: checkoutData.phone ? {
            area_code: checkoutData.phone.substring(0, 2),
            number: checkoutData.phone.substring(2),
          } : undefined,
          address: {
            street_name: checkoutData.street,
            street_number: checkoutData.number,
            zip_code: checkoutData.zipCode,
            city: checkoutData.city,
            state: checkoutData.state,
            country: "BR",
          },
        },
        back_urls: {
          success: `${window.location.origin}/pedido-confirmado/${order.id}`,
          failure: `${window.location.origin}/checkout`,
          pending: `${window.location.origin}/pedido-confirmado/${order.id}`,
        },
        auto_return: "approved",
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12,
        },
        external_reference: order.order_number,
      };

      const { data, error } = await supabase.functions.invoke('create-mercadopago-payment', {
        body: paymentData,
      });

      if (error) throw error;

      // Redirecionar para MercadoPago
      if (data?.sandbox_init_point) {
        window.location.href = data.sandbox_init_point;
      } else if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("URL de pagamento não encontrada");
      }

    } catch (error: any) {
      console.error('Erro ao criar pagamento MercadoPago:', error);
      throw new Error("Erro ao processar pagamento: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-serif text-primary">Finalizar Compra</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Checkout */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={checkoutData.firstName}
                        onChange={(e) => setCheckoutData({ ...checkoutData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={checkoutData.lastName}
                        onChange={(e) => setCheckoutData({ ...checkoutData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={checkoutData.email}
                        onChange={(e) => setCheckoutData({ ...checkoutData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={checkoutData.phone}
                        onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endereço de Entrega */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="street">Rua *</Label>
                      <Input
                        id="street"
                        value={checkoutData.street}
                        onChange={(e) => setCheckoutData({ ...checkoutData, street: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={checkoutData.number}
                        onChange={(e) => setCheckoutData({ ...checkoutData, number: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={checkoutData.complement}
                      onChange={(e) => setCheckoutData({ ...checkoutData, complement: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={checkoutData.neighborhood}
                        onChange={(e) => setCheckoutData({ ...checkoutData, neighborhood: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={checkoutData.city}
                        onChange={(e) => setCheckoutData({ ...checkoutData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={checkoutData.state}
                        onChange={(e) => setCheckoutData({ ...checkoutData, state: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={checkoutData.zipCode}
                      onChange={(e) => setCheckoutData({ ...checkoutData, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Método de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Método de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                    <Select
                      value={checkoutData.paymentMethod}
                      onValueChange={(value: any) => setCheckoutData({ ...checkoutData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto Bancário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações sobre o pedido</Label>
                    <Textarea
                      id="notes"
                      value={checkoutData.notes}
                      onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                      placeholder="Informações adicionais sobre o pedido..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
                      {item.products.images && Array.isArray(item.products.images) && item.products.images[0] && (
                        <img 
                          src={item.products.images[0]} 
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.products.name}</h4>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">Qtd: {item.quantity}</Badge>
                        <span className="font-medium">
                          R$ {(getItemPrice(item) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Frete:
                    </span>
                    <span>R$ {getShippingCost().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {getTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? "Processando..." : "Finalizar Pedido"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}