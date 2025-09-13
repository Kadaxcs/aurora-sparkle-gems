import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const OrderStatusTester = () => {
  const [orderId, setOrderId] = useState("");
  const [newStatus, setNewStatus] = useState<"pending" | "paid" | "failed" | "refunded" | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const updateOrderStatus = async () => {
    if (!orderId.trim() || !newStatus) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success(`Status do pedido atualizado para: ${newStatus}`);
      console.log("Pedido atualizado:", data);
    } catch (error: any) {
      console.error("Erro ao atualizar pedido:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 Teste de Atualização de Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="order-id">ID do Pedido</Label>
          <Input
            id="order-id"
            placeholder="Digite o ID do pedido..."
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Novo Status de Pagamento</Label>
          <Select value={newStatus} onValueChange={(value) => setNewStatus(value as "pending" | "paid" | "failed" | "refunded")}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={updateOrderStatus}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Atualizando..." : "Atualizar Status"}
        </Button>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700 text-sm">
            ⚠️ Esta funcionalidade é apenas para teste. Quando você mudar um pedido para "Pago", 
            os emails automáticos deverão ser disparados pelos triggers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusTester;