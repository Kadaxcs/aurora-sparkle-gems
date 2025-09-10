-- ===== SECURITY FIX: Corrigir acesso aos dados pessoais (v2) =====

-- 1. Primeiro, remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 2. Criar função de segurança para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar políticas de segurança restritivas para profiles
-- Usuários só podem ver o próprio perfil
CREATE POLICY "secure_profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins podem ver todos os perfis (necessário para administração)
CREATE POLICY "secure_profiles_select_admin" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

-- Usuários só podem atualizar o próprio perfil
CREATE POLICY "secure_profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Usuários só podem inserir o próprio perfil
CREATE POLICY "secure_profiles_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins podem gerenciar todos os perfis
CREATE POLICY "secure_profiles_admin_all" 
ON public.profiles 
FOR ALL 
USING (public.is_admin());

-- 4. Corrigir problema de segurança com cupons - remover acesso público
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;

-- Nova política: apenas usuários autenticados podem ver cupons ativos
CREATE POLICY "secure_coupons_auth_only" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);