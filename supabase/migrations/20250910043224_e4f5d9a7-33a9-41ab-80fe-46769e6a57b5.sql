-- Criar função para tornar emails específicos admins automaticamente
CREATE OR REPLACE FUNCTION public.make_specific_emails_admin()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função quando um usuário se registrar
DROP TRIGGER IF EXISTS on_auth_user_created_admin_check ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_check
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.make_specific_emails_admin();

-- Caso o email já esteja registrado, vamos verificar e atualizar
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Buscar usuário existente com esse email
  SELECT id, email INTO user_record 
  FROM auth.users 
  WHERE email = 'kadaxyz1@gmail.com';
  
  -- Se encontrar, tornar admin
  IF FOUND THEN
    INSERT INTO public.profiles (user_id, first_name, last_name, role)
    VALUES (user_record.id, 'Admin', 'Kadax', 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      first_name = 'Admin',
      last_name = 'Kadax';
      
    RAISE NOTICE 'Usuário % foi tornado administrador', user_record.email;
  ELSE
    RAISE NOTICE 'Usuário % não encontrado. Será tornado admin quando se registrar.', 'kadaxyz1@gmail.com';
  END IF;
END $$;