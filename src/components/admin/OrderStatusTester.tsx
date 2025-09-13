import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OrderStatusTester = () => {
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testPaymentUpdate = async () => {
    if (!orderId.trim()) {
      toast.error("Por favor, insira um ID de pedido");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-payment-update', {
        body: { orderId: orderId.trim() }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`Pedido ${orderId} atualizado para status: ${data.newStatus}`);
        console.log("Update result:", data);
      } else {
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      console.error("Error testing payment update:", error);
      toast.error(`Erro ao testar atualização: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teste de Atualização de Pagamento</CardTitle>
        <CardDescription>
          Use esta ferramenta para testar manualmente a atualização de status de pagamento de um pedido
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="ID do Pedido (UUID)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={testPaymentUpdate}
            disabled={isLoading || !orderId.trim()}
          >
            {isLoading ? "Testando..." : "Testar Pagamento"}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>• Este teste irá marcar o pedido como "pago"</p>
          <p>• Emails de confirmação serão enviados automaticamente</p>
          <p>• Use um ID de pedido existente da lista de pedidos</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusTester;