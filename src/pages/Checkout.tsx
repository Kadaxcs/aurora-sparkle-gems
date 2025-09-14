import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, Smartphone, Receipt, Upload, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { FreightCalculator } from "@/components/FreightCalculator";
import SecurityBadges from "@/components/SecurityBadges";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
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

interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: "credit_card" | "pix" | "boleto";
  notes: string;
}

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [freightCost, setFreightCost] = useState<number>(0);
  const [freightDays, setFreightDays] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    document: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    paymentMethod: "credit_card",
    notes: "",
  });

  const [personalizationData, setPersonalizationData] = useState({
    referenceImages: [] as File[],
    engravingText: "",
    preferredFinish: "",
    ringSize: "",
    deliveryUrgency: "normal",
    specialInstructions: "",
    landmark: "",
    preferredTime: "",
    authorizedReceiver: ""
  });

  useEffect(() => {
    checkAuthAndLoadCart();
  }, []);

  const checkAuthAndLoadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para acessar o checkout",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setUser(user);

      // Buscar dados do perfil
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

      // Buscar itens do carrinho
      const { data: items, error } = await supabase
        .from('cart_items')
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
        .eq('user_id', user.id);

      if (error) throw error;

      if (!items || items.length === 0) {
        toast({
          title: "Carrinho vazio",
          description: "Adicione produtos ao carrinho antes de finalizar",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setCartItems(items);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do checkout",
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
    const subtotal = getSubtotal();
    if (subtotal >= 299) {
      return 0; // Frete grátis acima de R$ 299
    }
    return freightCost;
  };

  const getTotal = () => {
    return getSubtotal() + getShippingCost();
  };

  const createOrder = async () => {
    try {
      // Gerar número do pedido
      const { data: orderNumber } = await supabase.rpc('generate_order_number');

      // Criar pedido
      const orderData = {
        user_id: user.id,
        order_number: orderNumber,
        subtotal: getSubtotal(),
        shipping_cost: getShippingCost(),
        total: getTotal(),
        payment_method: checkoutData.paymentMethod,
        shipping_address: {
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          phone: checkoutData.phone,
          zipCode: checkoutData.zipCode,
          street: checkoutData.street,
          number: checkoutData.number,
          complement: checkoutData.complement,
          neighborhood: checkoutData.neighborhood,
          city: checkoutData.city,
          state: checkoutData.state,
        },
        personalization_data: {
          engravingText: personalizationData.engravingText,
          preferredFinish: personalizationData.preferredFinish,
          ringSize: personalizationData.ringSize,
          deliveryUrgency: personalizationData.deliveryUrgency,
          specialInstructions: personalizationData.specialInstructions,
          landmark: personalizationData.landmark,
          preferredTime: personalizationData.preferredTime,
          authorizedReceiver: personalizationData.authorizedReceiver,
          referenceImagesCount: personalizationData.referenceImages.length,
        },
        notes: checkoutData.notes || null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
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

      return order;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  };

  const createMercadoPagoPayment = async (order: any) => {
    try {
      const items = cartItems.map(item => ({
        title: item.products.name,
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        currency_id: "BRL",
      }));

      // Adicionar frete como item separado se houver
      if (freightCost > 0) {
        items.push({
          title: "Frete",
          quantity: 1,
          unit_price: freightCost,
          currency_id: "BRL",
        });
      }

      // Sanitize MP-required numeric fields
      const phoneDigits = (checkoutData.phone || '').replace(/\D/g, '');
      const areaCode = phoneDigits.slice(0, 2);
      const phoneNumber = phoneDigits.slice(2);
      const documentDigits = (checkoutData.document || '').replace(/\D/g, '');
      const zipDigits = (checkoutData.zipCode || '').replace(/\D/g, '');

      const paymentData = {
        items,
        payer: {
          name: checkoutData.firstName,
          surname: checkoutData.lastName,
          email: checkoutData.email,
          phone: {
            area_code: areaCode,
            number: phoneNumber,
          },
          identification: {
            type: 'CPF',
            number: documentDigits,
          },
          address: {
            street_name: checkoutData.street,
            street_number: checkoutData.number,
            zip_code: zipDigits,
            city: checkoutData.city,
            state: checkoutData.state,
            country: 'BR',
          },
        },
        back_urls: {
          success: `${window.location.origin}/pedido-confirmado/${order.id}`,
          failure: `${window.location.origin}/checkout?error=payment_failed`,
          pending: `${window.location.origin}/pedido-confirmado/${order.id}?status=pending`,
        },
        auto_return: "approved",
        // Ensure MP notifies our backend
        notification_url: "https://vmhpmgiozhfzkzymvmaq.supabase.co/functions/v1/mercadopago-webhook",
        binary_mode: true,
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: checkoutData.paymentMethod === "credit_card"
            ? [
                { id: "ticket" },
                { id: "bank_transfer" },
                { id: "atm" },
                { id: "debit_card" },
                { id: "digital_currency" },
                { id: "digital_wallet" },
                { id: "prepaid_card" },
                { id: "voucher" }
              ]
            : checkoutData.paymentMethod === "pix"
            ? [
                { id: "ticket" },
                { id: "credit_card" },
                { id: "atm" },
                { id: "debit_card" },
                { id: "digital_currency" },
                { id: "digital_wallet" },
                { id: "prepaid_card" },
                { id: "voucher" }
              ]
            : [
                { id: "ticket" }
              ],
          installments: 12,
        },
        external_reference: order.id,
      };

      const { data, error } = await supabase.functions.invoke('create-mercadopago-payment', {
        body: paymentData,
      });

      if (error) throw error;

      // Redirecionar para o Mercado Pago
      window.location.href = data.init_point;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw error;
    }
  };

  const handleFreightCalculated = (freight: any) => {
    if (freight) {
      setFreightCost(freight.price);
      setFreightDays(freight.days);
    } else {
      setFreightCost(0);
      setFreightDays(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!checkoutData.firstName || !checkoutData.lastName || !checkoutData.email || 
        !checkoutData.phone || !checkoutData.document || !checkoutData.zipCode || 
        !checkoutData.street || !checkoutData.number || !checkoutData.neighborhood || 
        !checkoutData.city || !checkoutData.state) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para finalizar a compra",
        variant: "destructive",
      });
      return;
    }

    // Basic CPF validation (11 digits)
    const cpfNumbers = checkoutData.document.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, digite um CPF válido com 11 dígitos",
        variant: "destructive",
      });
      return;
    }

    // Validar se frete foi calculado para compras abaixo de R$ 299
    const subtotal = getSubtotal();
    if (subtotal < 299 && freightCost === 0) {
      toast({
        title: "Erro",
        description: "Calcule o frete antes de finalizar o pedido",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder();
      await createMercadoPagoPayment(order);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-serif font-bold">Finalizar Pedido</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário de Checkout */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={checkoutData.firstName}
                        onChange={(e) => setCheckoutData({ ...checkoutData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={checkoutData.lastName}
                        onChange={(e) => setCheckoutData({ ...checkoutData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={checkoutData.email}
                        onChange={(e) => setCheckoutData({ ...checkoutData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={checkoutData.phone}
                        onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="document">CPF *</Label>
                    <Input
                      id="document"
                      value={checkoutData.document}
                      onChange={(e) => setCheckoutData({ ...checkoutData, document: e.target.value })}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Endereço de Entrega */}
              <Card>
                <CardHeader>
                  <CardTitle>Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        value={checkoutData.zipCode}
                        onChange={(e) => setCheckoutData({ ...checkoutData, zipCode: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Rua *</Label>
                      <Input
                        id="street"
                        value={checkoutData.street}
                        onChange={(e) => setCheckoutData({ ...checkoutData, street: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={checkoutData.number}
                        onChange={(e) => setCheckoutData({ ...checkoutData, number: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={checkoutData.complement}
                        onChange={(e) => setCheckoutData({ ...checkoutData, complement: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={checkoutData.neighborhood}
                        onChange={(e) => setCheckoutData({ ...checkoutData, neighborhood: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={checkoutData.city}
                        onChange={(e) => setCheckoutData({ ...checkoutData, city: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={checkoutData.state}
                      onChange={(e) => setCheckoutData({ ...checkoutData, state: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <FreightCalculator 
                subtotal={getSubtotal()}
                onFreightCalculated={handleFreightCalculated}
                initialCep={checkoutData.zipCode}
              />

              {/* Personalização e Dados da HubJoias */}
              <Card>
                <CardHeader>
                  <CardTitle>Personalização e Detalhes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="referenceImages">Fotos de Referência</Label>
                    <div className="mt-2">
                      <Input
                        id="referenceImages"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setPersonalizationData(prev => ({ ...prev, referenceImages: files }));
                        }}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Anexe fotos de referência para personalização (máx. 5 fotos)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="engravingText">Texto para Gravação</Label>
                      <Input
                        id="engravingText"
                        value={personalizationData.engravingText}
                        onChange={(e) => setPersonalizationData(prev => ({ ...prev, engravingText: e.target.value }))}
                        placeholder="Ex: Maria & João"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ringSize">Tamanho do Anel</Label>
                      <Select
                        value={personalizationData.ringSize}
                        onValueChange={(value) => setPersonalizationData(prev => ({ ...prev, ringSize: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 21 }, (_, i) => i + 10).map(size => (
                            <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferredFinish">Acabamento Preferido</Label>
                      <Select
                        value={personalizationData.preferredFinish}
                        onValueChange={(value) => setPersonalizationData(prev => ({ ...prev, preferredFinish: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o acabamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="polido">Polido</SelectItem>
                          <SelectItem value="fosco">Fosco</SelectItem>
                          <SelectItem value="escovado">Escovado</SelectItem>
                          <SelectItem value="diamantado">Diamantado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="deliveryUrgency">Urgência da Entrega</Label>
                      <Select
                        value={personalizationData.deliveryUrgency}
                        onValueChange={(value) => setPersonalizationData(prev => ({ ...prev, deliveryUrgency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a urgência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (15-20 dias)</SelectItem>
                          <SelectItem value="urgente">Urgente (7-10 dias)</SelectItem>
                          <SelectItem value="super_urgente">Super Urgente (3-5 dias)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialInstructions">Instruções Especiais</Label>
                    <Textarea
                      id="specialInstructions"
                      value={personalizationData.specialInstructions}
                      onChange={(e) => setPersonalizationData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      placeholder="Detalhes específicos sobre a personalização, material, etc."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="landmark">Ponto de Referência</Label>
                      <Input
                        id="landmark"
                        value={personalizationData.landmark}
                        onChange={(e) => setPersonalizationData(prev => ({ ...prev, landmark: e.target.value }))}
                        placeholder="Ex: próximo ao shopping, em frente à farmácia"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredTime">Horário Preferido</Label>
                      <Select
                        value={personalizationData.preferredTime}
                        onValueChange={(value) => setPersonalizationData(prev => ({ ...prev, preferredTime: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manha">Manhã (8h-12h)</SelectItem>
                          <SelectItem value="tarde">Tarde (13h-17h)</SelectItem>
                          <SelectItem value="noite">Noite (18h-20h)</SelectItem>
                          <SelectItem value="qualquer">Qualquer horário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="authorizedReceiver">Pessoa Autorizada para Receber</Label>
                    <Input
                      id="authorizedReceiver"
                      value={personalizationData.authorizedReceiver}
                      onChange={(e) => setPersonalizationData(prev => ({ ...prev, authorizedReceiver: e.target.value }))}
                      placeholder="Nome de quem pode receber a encomenda (opcional)"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Forma de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={checkoutData.paymentMethod}
                    onValueChange={(value: "credit_card" | "pix" | "boleto") => 
                      setCheckoutData({ ...checkoutData, paymentMethod: value })
                    }
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card" className="flex items-center cursor-pointer">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Cartão de Crédito (até 12x sem juros)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center cursor-pointer">
                        <Smartphone className="h-4 w-4 mr-2" />
                        PIX (5% de desconto)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="boleto" id="boleto" />
                      <Label htmlFor="boleto" className="flex items-center cursor-pointer">
                        <Receipt className="h-4 w-4 mr-2" />
                        Boleto Bancário (3% de desconto)
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Observações */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Observações sobre o pedido (opcional)"
                    value={checkoutData.notes}
                    onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resumo do Pedido */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.products.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          R$ {(getItemPrice(item) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span className={getSubtotal() >= 299 ? "text-green-600 font-medium" : ""}>
                        {getSubtotal() >= 299 ? "GRÁTIS" : `R$ ${getShippingCost().toFixed(2)}`}
                      </span>
                    </div>
                    {freightDays > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Prazo de entrega:</span>
                        <span>{freightDays} dias úteis</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>R$ {getTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground mb-3">Compra 100% Segura</p>
                      <SecurityBadges variant="compact" showLabels={false} className="justify-center" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 text-lg"
                  >
                    {submitting ? "Processando..." : "Finalizar Pedido"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}