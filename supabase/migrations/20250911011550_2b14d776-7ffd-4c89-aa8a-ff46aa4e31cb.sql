-- Atualizar produtos de anéis com tamanhos padrão e material padrão
UPDATE public.products 
SET 
  available_sizes = '[12, 14, 16, 18, 20, 22]'::jsonb,
  material = 'Todas as Semijoias da BellaAurora possuem 10 milésimos de ouro'
WHERE category_id IN (
  SELECT id FROM public.categories WHERE LOWER(name) LIKE '%anel%' OR slug LIKE '%anel%'
);

-- Atualizar todos os produtos sem material definido
UPDATE public.products 
SET material = 'Todas as Semijoias da BellaAurora possuem 10 milésimos de ouro'
WHERE material IS NULL OR material = '';