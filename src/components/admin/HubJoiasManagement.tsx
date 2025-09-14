import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Send, 
  Eye, 
  Edit3, 
  Check, 
  Clock, 
  AlertTriangle, 
  Package,
  User,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'sent';
  payment_status: string;
  created_at: string;
  shipping_address: any;
  notes?: string;
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    total: number;
    created_at: string;
    order_id: string;
    products: {
      name: string;
      sku: string;
      images: any;
    };
  }>;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
  personalization_data?: {
    reference_images?: string[];
    engraving_text?: string;
    preferred_finish?: string;
    ring_size?: string;
  };
  delivery_preferences?: {
    urgency?: string;
    special_instructions?: string;
    landmark?: string;
    preferred_time?: string;
    authorized_receiver?: string;
  };
}

export function HubJoiasManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      // First fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, sku, images)
          )
        `)
        .eq('payment_status', 'paid')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(ordersData.map(order => order.user_id))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by user_id
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Combine orders with profiles
      const ordersWithProfiles = ordersData.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || null
      }));

      setOrders((ordersWithProfiles as unknown as Order[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pendente" },
      ready: { variant: "default" as const, icon: Check, label: "Pronto" },
      sent: { variant: "default" as const, icon: Send, label: "Enviado" },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'sent') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as any })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado",
      });

      if (newStatus === 'sent') {
        await fetchPendingOrders(); // Refresh to remove sent orders
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const simulateHubJoiasSubmission = async (order: Order) => {
    setSubmitting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await handleOrderStatusUpdate(order.id, 'sent');
      
      toast({
        title: "Pedido Enviado",
        description: `Pedido ${order.order_number} enviado para HubJoias`,
      });
      
      setSelectedOrder(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar pedido para HubJoias",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Gestão HubJoias</h2>
          <p className="text-muted-foreground">
            Gerencie pedidos para envio ao fornecedor
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {orders.length} pedidos pendentes
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Pedidos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pedidos Prontos para Envio</h3>
          
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum pedido pendente</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="cursor-pointer hover:bg-muted/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {order.profiles?.first_name || 'Cliente'} {order.profiles?.last_name || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{order.order_items.length} item(s)</span>
                    </div>
                    <div className="text-sm font-medium">
                      Total: R$ {order.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Revisar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detalhes do Pedido */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detalhes do Pedido</h3>
          
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedOrder.order_number}</CardTitle>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações do Cliente */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>{selectedOrder.profiles?.first_name || 'Cliente'} {selectedOrder.profiles?.last_name || ''}</p>
                    <p>{selectedOrder.profiles?.phone || 'Telefone não informado'}</p>
                  </div>
                </div>

                <Separator />

                {/* Endereço de Entrega */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Entrega
                  </h4>
                  <div className="text-sm">
                    {selectedOrder.shipping_address && (
                      <div className="space-y-1">
                        <p>{selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.number}</p>
                        <p>{selectedOrder.shipping_address.neighborhood}</p>
                        <p>{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.state}</p>
                        <p>CEP: {selectedOrder.shipping_address.zip_code}</p>
                        {selectedOrder.shipping_address.complement && (
                          <p>Complemento: {selectedOrder.shipping_address.complement}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Produtos */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="text-sm border rounded p-2">
                        <div className="font-medium">{item.products.name}</div>
                        <div className="text-muted-foreground">
                          SKU: {item.products.sku} | Qtd: {item.quantity} | 
                          Preço: R$ {item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dados de Personalização */}
                {selectedOrder.personalization_data && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Personalização</h4>
                      <div className="text-sm space-y-1">
                        {selectedOrder.personalization_data.engraving_text && (
                          <p><strong>Gravação:</strong> {selectedOrder.personalization_data.engraving_text}</p>
                        )}
                        {selectedOrder.personalization_data.preferred_finish && (
                          <p><strong>Acabamento:</strong> {selectedOrder.personalization_data.preferred_finish}</p>
                        )}
                        {selectedOrder.personalization_data.ring_size && (
                          <p><strong>Tamanho do Anel:</strong> {selectedOrder.personalization_data.ring_size}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => simulateHubJoiasSubmission(selectedOrder)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {submitting ? 'Enviando...' : 'Enviar para HubJoias'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um pedido para revisar os detalhes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}