import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Package, 
  MapPin, 
  CreditCard,
  ArrowLeft,
  Copy,
  Mail,
  Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: any;
  billing_address: any;
  notes?: string;
  created_at: string;
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    total: number;
    products: {
      name: string;
      images: any;
    };
  }>;
}

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              images
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      toast({
        title: "Erro",
        description: "Pedido não encontrado",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.order_number);
      toast({
        title: "Copiado!",
        description: "Número do pedido copiado para a área de transferência",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      confirmed: { label: "Confirmado", variant: "default" as const },
      processing: { label: "Preparando", variant: "default" as const },
      shipped: { label: "Enviado", variant: "default" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Aguardando", variant: "secondary" as const },
      paid: { label: "Pago", variant: "default" as const },
      failed: { label: "Falha", variant: "destructive" as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap = {
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      pix: "PIX",
      boleto: "Boleto Bancário",
    };
    
    return methodMap[method as keyof typeof methodMap] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header de Sucesso */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Pedido Confirmado!</h1>
          <p className="text-muted-foreground">
            Obrigado pela sua compra. Você receberá um e-mail com os detalhes do pedido.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Informações do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pedido #{order.order_number}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyOrderNumber}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status do Pedido</p>
                  <Badge variant={getStatusBadge(order.status).variant}>
                    {getStatusBadge(order.status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                  <Badge variant={getPaymentStatusBadge(order.payment_status).variant}>
                    {getPaymentStatusBadge(order.payment_status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Pedido</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produtos */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item) => (
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
                        <span className="text-sm text-muted-foreground">
                          Qtd: {item.quantity} × R$ {item.price.toFixed(2)}
                        </span>
                        <span className="font-medium">
                          R$ {item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span>R$ {order.shipping_cost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Entrega e Pagamento */}
            <div className="space-y-6">
              {/* Endereço de Entrega */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shipping_address && (
                    <div className="text-sm space-y-1">
                      <p>{order.shipping_address.street}, {order.shipping_address.number}</p>
                      {order.shipping_address.complement && (
                        <p>{order.shipping_address.complement}</p>
                      )}
                      <p>{order.shipping_address.neighborhood}</p>
                      <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                      <p>CEP: {order.shipping_address.zip_code}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Método de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Método: <span className="font-medium">
                      {getPaymentMethodLabel(order.payment_method)}
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* Observações */}
              {order.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Informações de Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-sm text-muted-foreground">contato@bellaaurorajoias.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">(11) 99999-9999</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Continuar Comprando
            </Button>
            <Button
              onClick={() => navigate("/meus-pedidos")}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Ver Meus Pedidos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}