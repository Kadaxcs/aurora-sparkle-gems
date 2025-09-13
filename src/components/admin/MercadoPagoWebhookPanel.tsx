import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import OrderStatusTester from "./OrderStatusTester";

const MercadoPagoWebhookPanel = () => {
  const [testOrderId, setTestOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const webhookUrl = "https://vmhpmgiozhfzkzymvmaq.supabase.co/functions/v1/mercadopago-webhook";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copiada para a área de transferência!");
  };

  const testWebhook = async () => {
    if (!testOrderId.trim()) {
      toast.error("Por favor, insira um ID de pedido para teste");
      return;
    }

    setIsLoading(true);
    try {
      // Simular um webhook de teste
      const testPayload = {
        id: Date.now(),
        live_mode: false,
        type: "payment",
        date_created: new Date().toISOString(),
        application_id: 123456,
        user_id: 654321,
        version: 1,
        api_version: "v1",
        action: "payment.updated",
        data: {
          id: "test_payment_id"
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast.success("Teste de webhook enviado com sucesso!");
      } else {
        toast.error("Erro ao testar webhook");
      }
    } catch (error) {
      console.error("Erro ao testar webhook:", error);
      toast.error("Erro ao testar webhook");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔗 Configuração do Webhook Mercado Pago
          </CardTitle>
          <CardDescription>
            Configure o webhook para receber notificações automáticas de pagamentos aprovados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Configuração Necessária</h4>
            <p className="text-yellow-700 text-sm mb-3">
              Para que os emails sejam enviados automaticamente quando um pagamento for aprovado, 
              você precisa configurar este webhook no painel do Mercado Pago.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://www.mercadopago.com.br/developers/panel/webhooks", "_blank")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Painel do Mercado Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Instruções de Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>
              <strong>Acesse o painel do Mercado Pago:</strong>
              <br />
              <span className="text-muted-foreground">
                Vá para https://www.mercadopago.com.br/developers/panel/webhooks
              </span>
            </li>
            <li>
              <strong>Clique em "Criar webhook"</strong>
            </li>
            <li>
              <strong>Configure os seguintes campos:</strong>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>URL:</strong> {webhookUrl}</li>
                <li><strong>Eventos:</strong> Selecione "Pagamentos"</li>
                <li><strong>Modo:</strong> Produção (para o site real)</li>
              </ul>
            </li>
            <li>
              <strong>Salve a configuração</strong>
            </li>
            <li>
              <strong>Teste o webhook</strong> fazendo um pagamento de teste
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste do Webhook</CardTitle>
          <CardDescription>
            Teste se o webhook está funcionando corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-order-id">ID do Pedido para Teste</Label>
            <Input
              id="test-order-id"
              placeholder="Digite um ID de pedido existente..."
              value={testOrderId}
              onChange={(e) => setTestOrderId(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={testWebhook}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Testando..." : "Enviar Teste de Webhook"}
          </Button>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Como Funciona</h4>
            <p className="text-blue-700 text-sm">
              Quando um cliente completa um pagamento no Mercado Pago, eles enviam uma notificação 
              para este webhook. O webhook então:
            </p>
            <ul className="list-disc list-inside text-blue-700 text-sm mt-2 ml-2">
              <li>Verifica o status do pagamento</li>
              <li>Atualiza o pedido no banco de dados</li>
              <li>Dispara os emails automáticos (cliente e admin)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <OrderStatusTester />
    </div>
  );
};

export default MercadoPagoWebhookPanel;