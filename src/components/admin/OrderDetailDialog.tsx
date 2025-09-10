import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
  products?: {
    name: string;
  };
}

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
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  tracking_code?: string;
}

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: () => void;
  order: Order | null;
}

export function OrderDetailDialog({ 
  open, 
  onOpenChange, 
  onOrderUpdated,
  order
}: OrderDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (order && open) {
      setOrderStatus(order.status);
      setPaymentStatus(order.payment_status);
      fetchOrderItems();
    }
  }, [order, open]);

  const fetchOrderItems = async () => {
    if (!order) return;

    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name)
        `)
        .eq('order_id', order.id);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens do pedido:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: orderStatus as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled",
          payment_status: paymentStatus as "pending" | "paid" | "failed" | "refunded",
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Status do pedido atualizado com sucesso",
      });

      onOrderUpdated();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Erro ao atualizar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido #{order.order_number}</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações do pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status do Pedido</Label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status do Pagamento</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-medium">Data do Pedido</Label>
              <p className="text-sm">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Total</Label>
              <p className="text-sm font-semibold">R$ {order.total.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Código de Rastreamento</Label>
              <p className="text-sm">{order.tracking_code || "—"}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <Label className="text-lg font-semibold">Itens do Pedido</Label>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.products?.name || "Produto não encontrado"}
                    </TableCell>
                    <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>R$ {item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-end space-y-1">
              <div className="text-right space-y-1">
                <div className="flex justify-between w-48">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.shipping_cost && order.shipping_cost > 0 && (
                  <div className="flex justify-between w-48">
                    <span>Frete:</span>
                    <span>R$ {order.shipping_cost.toFixed(2)}</span>
                  </div>
                )}
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between w-48 text-green-600">
                    <span>Desconto:</span>
                    <span>-R$ {order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {order.shipping_address && (
            <div>
              <Label className="text-lg font-semibold">Endereço de Entrega</Label>
              <div className="mt-2 p-3 bg-muted rounded">
                <p className="text-sm">
                  {order.shipping_address.street}, {order.shipping_address.number}
                  {order.shipping_address.complement && `, ${order.shipping_address.complement}`}
                </p>
                <p className="text-sm">
                  {order.shipping_address.neighborhood} - {order.shipping_address.city}, {order.shipping_address.state}
                </p>
                <p className="text-sm">CEP: {order.shipping_address.zip_code}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <Label className="text-lg font-semibold">Observações</Label>
              <p className="mt-2 p-3 bg-muted rounded text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button onClick={handleUpdateStatus} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}