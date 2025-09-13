import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailDialog } from "./OrderDetailDialog";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  shipping_cost?: number;
  discount_amount?: number;
  created_at: string;
  user_id?: string;
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  tracking_code?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [orderToView, setOrderToView] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Orders query result:', { data: ordersData, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Try to enrich with profile data in a second query (no FK relationship exists)
      const ordersList = (ordersData as any[]) || [];
      const userIds = Array.from(new Set(ordersList.map(o => o.user_id).filter(Boolean)));
      let profilesMap: Record<string, { first_name?: string; last_name?: string; phone?: string }> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, phone')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc: any, p: any) => {
            acc[p.user_id] = { first_name: p.first_name, last_name: p.last_name, phone: p.phone };
            return acc;
          }, {} as Record<string, any>);
        } else if (profilesError) {
          console.warn('Não foi possível carregar perfis vinculados:', profilesError);
        }
      }

      const enriched = ordersList.map((o: any) => ({
        ...o,
        profiles: o.user_id ? profilesMap[o.user_id] : undefined,
      }));
      
      setOrders(enriched);
      console.log('Orders set successfully:', enriched);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      pending: { label: "Pendente", variant: "secondary" as const },
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

  const openDetailDialog = (order: Order) => {
    setOrderToView(order);
    setDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número do Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {order.profiles?.first_name && order.profiles?.last_name
                          ? `${order.profiles.first_name} ${order.profiles.last_name}`
                          : 'Cliente não identificado'
                        }
                      </span>
                      {order.profiles?.phone && (
                        <span className="text-sm text-muted-foreground">
                          {order.profiles.phone}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        ID: {order.user_id?.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(order.payment_status)}
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDetailDialog(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDetailDialog(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <OrderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onOrderUpdated={fetchOrders}
        order={orderToView}
      />
    </div>
  );
}