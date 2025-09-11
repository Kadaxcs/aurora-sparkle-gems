-- Atualizar função de notificação para enviar emails para clientes também
CREATE OR REPLACE FUNCTION notify_order_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Enviar notificação admin quando pagamento for confirmado
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Notificação para admin
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

    -- Email de confirmação de pagamento para cliente
    PERFORM net.http_post(
      url := 'https://vmhpmgiozhfzkzymvmaq.supabase.co/functions/v1/send-customer-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaHBtZ2lvemhmemt6eW12bWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTM0ODAsImV4cCI6MjA3MzAyOTQ4MH0.lybFy8ZuoCgWblJRMSgKonDBilG-t5aLt9xPA9yEo-w'
      ),
      body := jsonb_build_object(
        'orderId', NEW.id::text,
        'emailType', 'payment_confirmed'
      )
    );
  END IF;

  -- Email de confirmação inicial quando pedido é criado
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := 'https://vmhpmgiozhfzkzymvmaq.supabase.co/functions/v1/send-customer-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaHBtZ2lvemhmemt6eW12bWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTM0ODAsImV4cCI6MjA3MzAyOTQ4MH0.lybFy8ZuoCgWblJRMSgKonDBilG-t5aLt9xPA9yEo-w'
      ),
      body := jsonb_build_object(
        'orderId', NEW.id::text,
        'emailType', 'confirmation'
      )
    );
  END IF;

  -- Emails de mudança de status
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    DECLARE
      email_type TEXT;
    BEGIN
      CASE NEW.status
        WHEN 'processing' THEN email_type := 'processing';
        WHEN 'shipped' THEN email_type := 'shipped';
        WHEN 'delivered' THEN email_type := 'delivered';
        ELSE email_type := NULL;
      END CASE;

      IF email_type IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://vmhpmgiozhfzkzymvmaq.supabase.co/functions/v1/send-customer-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaHBtZ2lvemhmemt6eW12bWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTM0ODAsImV4cCI6MjA3MzAyOTQ4MH0.lybFy8ZuoCgWblJRMSgKonDBilG-t5aLt9xPA9yEo-w'
          ),
          body := jsonb_build_object(
            'orderId', NEW.id::text,
            'emailType', email_type,
            'trackingCode', COALESCE(NEW.tracking_code, '')
          )
        );
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar triggers
DROP TRIGGER IF EXISTS trigger_paid_order_notification ON orders;
DROP TRIGGER IF EXISTS trigger_order_updates ON orders;

-- Trigger para novos pedidos
CREATE TRIGGER trigger_order_creation
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_updates();

-- Trigger para atualizações de pedidos  
CREATE TRIGGER trigger_order_updates
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_updates();

-- Adicionar coluna tracking_code se não existir
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;

-- Comentários
COMMENT ON FUNCTION notify_order_updates() IS 'Envia emails automáticos para clientes e admin baseado no status do pedido';
COMMENT ON TRIGGER trigger_order_creation ON orders IS 'Envia email de confirmação quando pedido é criado';
COMMENT ON TRIGGER trigger_order_updates ON orders IS 'Envia emails quando pedido é atualizado';