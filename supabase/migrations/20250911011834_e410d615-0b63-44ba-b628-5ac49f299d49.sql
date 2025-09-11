-- Atualizar categorias existentes com descrições apropriadas para joias
UPDATE public.categories 
SET 
  name = 'Anéis',
  description = 'Anéis elegantes e modernos para todas as ocasiões'
WHERE slug = 'aneis';

UPDATE public.categories 
SET 
  description = 'Brincos sofisticados para completar seu look'
WHERE slug = 'brincos';

UPDATE public.categories 
SET 
  description = 'Colares delicados e marcantes'
WHERE slug = 'colares';

UPDATE public.categories 
SET 
  description = 'Pulseiras elegantes e versáteis'
WHERE slug = 'pulseiras';

-- Remover categoria Pingentes (não está na lista desejada)
DELETE FROM public.categories WHERE slug = 'pingentes';

-- Inserir novas categorias que estão faltando
INSERT INTO public.categories (name, slug, description, is_active) 
VALUES 
  ('Tornozeleiras', 'tornozeleiras', 'Tornozeleiras delicadas e charmosas', true),
  ('Masculinas', 'masculinas', 'Joias e acessórios masculinos', true);