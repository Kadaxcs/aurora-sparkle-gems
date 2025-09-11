-- Adicionar campo de tamanhos disponíveis aos produtos
ALTER TABLE public.products 
ADD COLUMN available_sizes jsonb DEFAULT '[]'::jsonb;

-- Adicionar comentário para documentar o formato esperado
COMMENT ON COLUMN public.products.available_sizes IS 'Array de tamanhos disponíveis para o produto. Ex: [14, 16, 18, 20, 22] para anéis ou ["P", "M", "G"] para roupas';

-- Atualizar produtos existentes que são anéis para ter tamanhos padrão
UPDATE public.products 
SET available_sizes = '[14, 16, 18, 20, 22]'::jsonb
WHERE LOWER(name) LIKE '%anel%' OR LOWER(name) LIKE '%ring%';

-- Atualizar outros produtos com tamanhos genéricos se necessário
UPDATE public.products 
SET available_sizes = '["Único"]'::jsonb
WHERE available_sizes = '[]'::jsonb;