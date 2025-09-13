import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Calendar, CreditCard, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  payment_method: string;
  shipping_address: any;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    products: {
      name: string;
      images: any;
    };
  }>;
}

export default function MeusPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      await fetchOrders(session.user.id);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            total,
            products (
              name,
              images
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus pedidos",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      processing: { label: "Processando", variant: "default" as const },
      shipped: { label: "Enviado", variant: "outline" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || 
      { label: status, variant: "secondary" as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusMap = {
      pending: { label: "Aguardando", variant: "secondary" as const },
      paid: { label: "Pago", variant: "default" as const },
      failed: { label: "Falhou", variant: "destructive" as const },
      refunded: { label: "Reembolsado", variant: "outline" as const },
    };

    const statusInfo = statusMap[paymentStatus as keyof typeof statusMap] || 
      { label: paymentStatus, variant: "secondary" as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à loja
          </Button>
          
          <div className="text-center mb-6">
            <h1 className="text-4xl font-serif text-foreground mb-2">
              Meus Pedidos
            </h1>
            <p className="text-lg text-muted-foreground">
              💝 Obrigado pela sua compra! Suas joias estão sendo preparadas com muito carinho.
            </p>
          </div>
        </div>

        {/* Orders */}
        <div className="space-y-6">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id} className="border border-border bg-card shadow-lg">
                <CardHeader className="border-b border-border/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <div>
                      <CardTitle className="text-xl font-serif text-card-foreground">
                        Pedido #{order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Products */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-card-foreground mb-4 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Produtos
                    </h3>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-background rounded-lg border">
                          {item.products?.images && Array.isArray(item.products.images) && item.products.images[0] && (
                            <img
                              src={item.products.images[0]}
                              alt={item.products?.name}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.products?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantidade: {item.quantity} × R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              R$ {item.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Payment Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-card-foreground flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagamento
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Método:</span>
                          <span className="font-medium">{getPaymentMethodLabel(order.payment_method)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>R$ {order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frete:</span>
                          <span>R$ {order.shipping_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span className="text-primary">R$ {order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shipping_address && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-card-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Endereço de Entrega
                        </h4>
                        <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
                          <p>{order.shipping_address.street}, {order.shipping_address.number}</p>
                          {order.shipping_address.complement && (
                            <p>{order.shipping_address.complement}</p>
                          )}
                          <p>{order.shipping_address.neighborhood}</p>
                          <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                          <p>CEP: {order.shipping_address.zip_code}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Message */}
                  <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                    <p className="text-sm text-primary font-medium">
                      {order.payment_status === 'paid' 
                        ? "✨ Pagamento confirmado! Suas joias estão sendo preparadas com carinho especial."
                        : "⏳ Aguardando confirmação do pagamento. Assim que aprovado, começaremos a preparar seu pedido."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border border-border bg-card text-center py-12">
              <CardContent>
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Você ainda não fez nenhum pedido. Explore nossa coleção de joias!
                </p>
                <Button onClick={() => navigate('/')}>
                  Ir às compras
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Thank you message */}
        {orders.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg p-8">
              <h2 className="text-2xl font-serif text-primary mb-4">
                💎 Obrigado pela sua confiança! 💎
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Cada joia é criada especialmente para você com todo amor e cuidado. 
                Acompanhe o status dos seus pedidos e em breve você receberá suas lindas joias!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}