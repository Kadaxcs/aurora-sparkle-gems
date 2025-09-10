-- ===== SECURITY FIX: Corrigir search_path das funções =====

-- Corrigir todas as funções existentes para ter search_path definido
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