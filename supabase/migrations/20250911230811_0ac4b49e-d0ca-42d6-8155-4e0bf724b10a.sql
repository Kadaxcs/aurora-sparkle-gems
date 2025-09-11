-- Habilitar extensões necessárias para HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função para enviar notificação de pedido pago via HTTP
CREATE OR REPLACE FUNCTION notify_paid_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Enviar notificação apenas quando status muda para 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Fazer requisição HTTP para a edge function de notificação
    PERFORM net.http_post(
      url := 'https://vmhpmgiozhfzkzymvmaq.supabase.co/functions/v1/send-order-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaHBtZ2lvemhmemt6eW12bWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTM0ODAsImV4cCI6MjA3MzAyOTQ4MH0.lybFy8ZuoCgWblJRMSgKonDBilG-t5aLt9xPA9yEo-w'
      ),
      body := jsonb_build_object(
        'orderId', NEW.id::text,
        'adminEmail', 'kadaxyz1@gmail.com'
      )
    );
    
    -- Log da ação para debug
    RAISE NOTICE 'Notificação enviada para pedido %', NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa a função quando um pedido é atualizado
DROP TRIGGER IF EXISTS trigger_paid_order_notification ON orders;

CREATE TRIGGER trigger_paid_order_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_paid_order();

-- Comentário explicativo
COMMENT ON FUNCTION notify_paid_order() IS 'Envia notificação por email quando um pedido é marcado como pago';
COMMENT ON TRIGGER trigger_paid_order_notification ON orders IS 'Trigger que envia notificação automática quando pedido é pago';