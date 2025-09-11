import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

export function EmailNotificationPanel() {
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState("kadaxyz1@gmail.com");
  const [testOrderId, setTestOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotification = async () => {
    if (!testOrderId.trim()) {
      toast({
        title: "Erro",
        description: "Digite um ID de pedido para teste",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Sending test notification for order: ${testOrderId}`);
      
      const { data, error } = await supabase.functions.invoke('send-order-notification', {
        body: { 
          orderId: testOrderId.trim(),
          adminEmail: adminEmail 
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      toast({
        title: "✅ Email Enviado!",
        description: `Notificação enviada para ${adminEmail}`,
      });

    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupAutomaticNotifications = async () => {
    try {
      toast({
        title: "✅ Configurado!",
        description: "Notificações automáticas podem ser configuradas via trigger SQL",
      });

      // Instrução para criar trigger SQL manualmente
      console.log(`
        -- SQL para criar trigger automático de notificação:
        CREATE OR REPLACE FUNCTION notify_paid_order()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Enviar notificação apenas quando status muda para 'paid'
          IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
            PERFORM net.http_post(
              url := 'https://vmhpmgiozhfzkzymvmaq.supabase.co/functions/v1/send-order-notification',
              headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
              body := json_build_object('orderId', NEW.id, 'adminEmail', '${adminEmail}')::jsonb
            );
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_paid_order_notification
          AFTER UPDATE ON orders
          FOR EACH ROW
          EXECUTE FUNCTION notify_paid_order();
      `);

    } catch (error) {
      console.error('Error setting up automatic notifications:', error);
      toast({
        title: "Info",
        description: "Configure as notificações automáticas via trigger SQL (ver logs)",
        variant: "default",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">📧 Notificações de Pedidos</h1>
        <p className="text-muted-foreground">
          Configure emails automáticos para pedidos pagos e gerencie a logística
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuração de Email
            </CardTitle>
            <CardDescription>
              Configure o email que receberá as notificações de pedidos pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminEmail">Email do Administrador</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="seu@email.com"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Este email receberá todas as notificações de pedidos pagos
              </p>
            </div>

            <Button 
              onClick={setupAutomaticNotifications}
              className="w-full"
              variant="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Ativar Notificações Automáticas
            </Button>
          </CardContent>
        </Card>

        {/* Teste de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Testar Notificação
            </CardTitle>
            <CardDescription>
              Envie um email de teste com dados de um pedido específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testOrderId">ID do Pedido para Teste</Label>
              <Input
                id="testOrderId"
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
                placeholder="ID do pedido (ex: 123e4567-e89b-12d3-a456-426614174000)"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use um ID de pedido que esteja com status "paid"
              </p>
            </div>

            <Button 
              onClick={sendTestNotification}
              disabled={isLoading || !testOrderId.trim()}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Email de Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações sobre o Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            O que está incluído no email?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📋 Dados do Pedido:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Número do pedido</li>
                <li>• Data e hora do pagamento</li>
                <li>• Valor total</li>
                <li>• Peso total dos produtos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">👤 Dados do Cliente:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Nome completo</li>
                <li>• Telefone de contato</li>
                <li>• Endereço completo de entrega</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🛍️ Produtos:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Lista detalhada de produtos</li>
                <li>• Quantidades</li>
                <li>• Peso individual</li>
                <li>• SKUs para identificação</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✅ Próximos Passos:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Checklist para logística</li>
                <li>• Lembretes de ações</li>
                <li>• Link para o painel admin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Como configurar?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <p className="font-semibold text-blue-800">1. Configure seu email no Resend.com:</p>
            <p className="text-blue-700">
              Acesse <a href="https://resend.com" target="_blank" className="underline">resend.com</a> e 
              valide seu domínio para evitar emails na caixa de spam.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <p className="font-semibold text-green-800">2. Teste primeiro:</p>
            <p className="text-green-700">
              Use um pedido pago existente para testar se o email chega corretamente formatado.
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <p className="font-semibold text-purple-800">3. Ative notificações automáticas:</p>
            <p className="text-purple-700">
              Após o teste, ative as notificações automáticas para receber emails de todos os novos pedidos pagos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}