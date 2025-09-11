-- ===== SECURITY FIX FINAL: Implementar verificação robusta de admin =====

-- 1. Remover a política de admin que pode ser problemática
DROP POLICY IF EXISTS "secure_profiles_admin_all" ON public.profiles;

-- 2. Criar função mais segura para verificar admin
CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS BOOLEAN AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Verificar se o usuário atual está autenticado
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o usuário tem role admin de forma mais segura
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles 
  WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND user_id IS NOT NULL;
  
  RETURN admin_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar política mais restritiva para admins
CREATE POLICY "verified_admin_can_read_profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.is_verified_admin() 
  AND auth.uid() != user_id  -- Admin não precisa desta política para ver próprio perfil
);

-- 4. Criar política mais restritiva para admins gerenciarem outros usuários
CREATE POLICY "verified_admin_can_manage_others" 
ON public.profiles 
FOR UPDATE 
USING (
  public.is_verified_admin() 
  AND auth.uid() != user_id  -- Admin não pode usar esta política no próprio perfil
);

-- 5. Proteger melhor a tabela orders - user_id deve ser sempre obrigatório
-- Primeiro vamos adicionar uma constraint para garantir que user_id não seja null
-- para novos pedidos (exceto durante processo de checkout)
CREATE OR REPLACE FUNCTION public.validate_order_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Durante o processo de criação, permitir user_id null temporariamente
  -- Mas não permitir que permaneça null após 5 minutos
  IF NEW.user_id IS NULL AND OLD.created_at < NOW() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Order must have a valid user_id';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplicar trigger de validação
DROP TRIGGER IF EXISTS validate_order_user_trigger ON public.orders;
CREATE TRIGGER validate_order_user_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_user_id();

-- 6. Política mais restritiva para orders - admin só vê orders com user_id válido
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "verified_admin_can_view_valid_orders" 
ON public.orders 
FOR SELECT 
USING (
  public.is_verified_admin() 
  AND user_id IS NOT NULL
);

-- 7. Criar função para limpar dados sensíveis em consultas não-admin
CREATE OR REPLACE FUNCTION public.sanitize_profile_for_display(
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text
) RETURNS TABLE (
  user_id uuid,
  display_name text,
  phone_masked text
) AS $$
BEGIN
  -- Se for o próprio usuário ou admin, mostrar dados completos
  IF auth.uid() = p_user_id OR public.is_verified_admin() THEN
    RETURN QUERY SELECT 
      p_user_id,
      COALESCE(p_first_name || ' ' || p_last_name, 'Usuário'),
      p_phone;
  ELSE
    -- Para outros, mascarar dados sensíveis
    RETURN QUERY SELECT 
      p_user_id,
      COALESCE(LEFT(p_first_name, 1) || '***', 'Usuário'),
      CASE 
        WHEN p_phone IS NOT NULL THEN '***-***-' || RIGHT(p_phone, 4)
        ELSE NULL
      END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;