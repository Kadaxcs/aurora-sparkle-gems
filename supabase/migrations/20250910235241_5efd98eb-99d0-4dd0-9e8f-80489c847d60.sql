-- ===== SECURITY FIX: Corrigir acesso aos dados pessoais =====

-- 1. Criar função de segurança para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Atualizar políticas da tabela profiles para maior segurança
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Política restritiva para SELECT - apenas o próprio usuário pode ver seus dados
CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para admins verem todos os perfis (para administração)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

-- Política para UPDATE - apenas o próprio usuário
CREATE POLICY "Users can only update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para INSERT - apenas o próprio usuário
CREATE POLICY "Users can only insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para admins gerenciarem usuários
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin());

-- 3. Corrigir problema de segurança com cupons - remover acesso público
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;

-- Nova política: apenas usuários autenticados podem ver cupons ativos
CREATE POLICY "Authenticated users can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- 4. Corrigir search_path das funções existentes para segurança
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT, 10, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.make_specific_emails_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o email é um dos emails admin específicos
  IF NEW.email = 'kadaxyz1@gmail.com' THEN
    -- Atualizar ou inserir o perfil como admin
    INSERT INTO public.profiles (user_id, first_name, last_name, role)
    VALUES (NEW.id, 'Admin', 'Kadax', 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      first_name = 'Admin',
      last_name = 'Kadax';
  END IF;
  
  RETURN NEW;
END;
$$;