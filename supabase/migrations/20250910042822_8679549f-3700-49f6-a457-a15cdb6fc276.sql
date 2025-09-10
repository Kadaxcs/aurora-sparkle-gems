-- Criar um usuário administrador de exemplo
-- Primeiro, vamos inserir um perfil de admin direto na tabela profiles
-- Em produção, isso seria feito após o usuário se registrar

-- Inserir um perfil de administrador
INSERT INTO public.profiles (user_id, first_name, last_name, role, phone)
VALUES (
  'admin-example-uuid-12345', 
  'Admin', 
  'Bella Aurora', 
  'admin',
  '(11) 99999-9999'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  first_name = 'Admin',
  last_name = 'Bella Aurora';

-- Nota: Como não podemos inserir diretamente na tabela auth.users via SQL,
-- você precisará se registrar normalmente e depois executar este UPDATE:
-- UPDATE public.profiles SET role = 'admin' WHERE user_id = auth.uid();