-- Criar tabela para gerenciar conteúdo das páginas institucionais
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Pages are viewable by everyone" 
ON public.pages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage pages" 
ON public.pages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pages
INSERT INTO public.pages (slug, title, content, meta_description) VALUES
('sobre-nos', 'Sobre a Bella Aurora', 'A Bella Aurora é uma empresa especializada em joias e semi-joias de alta qualidade, localizada no coração de Osório - RS.

## Nossa História

Fundada com o objetivo de proporcionar beleza e elegância através de peças únicas, a Bella Aurora se dedica a criar joias que contam histórias e celebram momentos especiais.

## Nossa Missão

Oferecer joias e semi-joias de qualidade excepcional, com design exclusivo e atendimento personalizado, tornando cada momento especial ainda mais brilhante.

## Nossa Visão

Ser reconhecida como referência em joias e semi-joias na região, proporcionando experiências únicas aos nossos clientes.

## Nossos Valores

- **Qualidade**: Compromisso com materiais e acabamentos de primeira linha
- **Autenticidade**: Peças únicas e designs exclusivos
- **Atendimento**: Relacionamento próximo e personalizado
- **Confiança**: Transparência em todos os processos', 'Conheça a história da Bella Aurora, especialista em joias e semi-joias em Osório - RS'),

('politica-troca-devolucao', 'Política de Troca e Devolução', '# Política de Troca e Devolução

## Condições Gerais

A Bella Aurora trabalha com produtos de qualidade e zela pela satisfação de seus clientes. Por isso, oferecemos as seguintes condições para trocas e devoluções:

## Prazo para Troca/Devolução

- **30 dias** corridos a partir do recebimento do produto
- Para compras presenciais: 30 dias a partir da data da compra

## Condições para Troca/Devolução

### Produtos Aceitos:
- Produtos em perfeito estado de conservação
- Embalagem original preservada
- Etiquetas e certificados (quando aplicável)
- Nota fiscal de compra

### Produtos NÃO Aceitos:
- Joias personalizadas ou sob encomenda
- Produtos com sinais de uso ou desgaste
- Itens danificados por mau uso
- Produtos sem embalagem original

## Como Solicitar

1. Entre em contato conosco pelo WhatsApp: (51) 9 8176-5717
2. Informe o número do pedido
3. Descreva o motivo da troca/devolução
4. Nossa equipe orientará sobre o processo

## Frete

- **Defeito do produto**: Frete de devolução por nossa conta
- **Desistência**: Frete de devolução por conta do cliente
- **Troca**: Novo frete por conta do cliente

## Reembolso

- Processado em até 7 dias úteis após recebimento do produto
- Valor creditado na mesma forma de pagamento original
- Para pagamentos via PIX: informar dados bancários

## Contato

Para dúvidas sobre nossa política de trocas:
- WhatsApp: (51) 9 8176-5717
- E-mail: contato@bellaaurorajoias.com.br', 'Conheça nossa política de troca e devolução. Condições especiais para sua segurança e satisfação.'),

('politica-privacidade', 'Política de Privacidade', '# Política de Privacidade

**Última atualização: Janeiro de 2025**

A Bella Aurora respeita sua privacidade e está comprometida em proteger suas informações pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD).

## Informações que Coletamos

### Dados Fornecidos Voluntariamente:
- Nome completo
- E-mail
- Telefone/WhatsApp
- Endereço de entrega
- CPF (para emissão de nota fiscal)

### Dados Coletados Automaticamente:
- Informações de navegação
- Cookies e tecnologias similares
- Endereço IP
- Dados de acesso e uso do site

## Como Utilizamos suas Informações

- Processar pedidos e pagamentos
- Comunicar sobre status do pedido
- Oferecer suporte ao cliente
- Enviar ofertas e novidades (mediante consentimento)
- Melhorar nossos serviços
- Cumprir obrigações legais

## Compartilhamento de Dados

Seus dados podem ser compartilhados apenas com:
- **Operadoras de pagamento** (Mercado Pago)
- **Transportadoras** (para entrega)
- **Órgãos fiscalizadores** (quando exigido por lei)

**NÃO vendemos ou alugamos** suas informações para terceiros.

## Seus Direitos (LGPD)

Você tem direito a:
- **Acesso**: Saber quais dados temos sobre você
- **Correção**: Corrigir dados incorretos
- **Exclusão**: Solicitar remoção de seus dados
- **Portabilidade**: Receber seus dados em formato estruturado
- **Revogação**: Retirar consentimento a qualquer momento

## Segurança

- Utilizamos tecnologia SSL
- Servidores seguros e protegidos
- Acesso restrito aos dados
- Backups regulares e seguros

## Cookies

Utilizamos cookies para:
- Melhorar a experiência de navegação
- Analisar o tráfego do site
- Personalizar conteúdo
- Funcionalidades do carrinho de compras

## Contato - Encarregado de Dados

Para exercer seus direitos ou esclarecer dúvidas:
- E-mail: contato@bellaaurorajoias.com.br
- WhatsApp: (51) 9 8176-5717

## Alterações

Esta política pode ser atualizada periodicamente. Alterações serão comunicadas em nosso site.', 'Política de Privacidade da Bella Aurora. Conheça como protegemos seus dados pessoais conforme a LGPD.'),

('termos-condicoes', 'Termos e Condições', '# Termos e Condições de Uso

**Última atualização: Janeiro de 2025**

## 1. Aceitação dos Termos

Ao utilizar o site da Bella Aurora, você concorda com estes termos e condições. Se não concordar, pedimos que não utilize nossos serviços.

## 2. Sobre a Empresa

**Razão Social**: Bella Aurora Joias  
**Endereço**: Centro, Osório - RS  
**E-mail**: contato@bellaaurorajoias.com.br  
**Telefone**: (51) 9 8176-5717  

## 3. Produtos e Preços

- Preços sujeitos a alteração sem aviso prévio
- Promoções válidas enquanto durarem os estoques
- Cores podem variar conforme monitor/dispositivo
- Especificações técnicas podem sofrer alterações

## 4. Pedidos e Pagamentos

### Confirmação de Pedido:
- Pedidos confirmados após aprovação do pagamento
- Vendas sujeitas à análise de crédito
- Produtos sujeitos à disponibilidade de estoque

### Formas de Pagamento:
- Cartão de crédito (até 12x)
- PIX (desconto à vista)
- Boleto bancário
- Transferência bancária

## 5. Entrega

- Prazo de entrega não inclui finais de semana e feriados
- Prazo inicia após confirmação do pagamento
- Entrega realizada via Correios ou transportadora
- Cliente responsável por conferir endereço

## 6. Responsabilidades do Cliente

- Fornecer informações verdadeiras
- Conferir dados do pedido
- Estar presente no endereço de entrega
- Comunicar problemas em até 7 dias

## 7. Responsabilidades da Empresa

- Entregar produtos conforme especificado
- Manter sigilo das informações
- Cumprir prazos estabelecidos
- Prestar suporte adequado

## 8. Propriedade Intelectual

- Conteúdo protegido por direitos autorais
- Uso comercial não autorizado
- Marca Bella Aurora é propriedade registrada

## 9. Limitações de Responsabilidade

A Bella Aurora não se responsabiliza por:
- Danos indiretos ou lucros cessantes
- Problemas causados por terceiros
- Falhas de conectividade
- Uso inadequado dos produtos

## 10. Resolução de Conflitos

- Tentativa de resolução amigável
- Foro da comarca de Osório - RS
- Aplicação da legislação brasileira

## 11. Contato

Dúvidas sobre estes termos:
- E-mail: contato@bellaaurorajoias.com.br
- WhatsApp: (51) 9 8176-5717
- Endereço: Centro, Osório - RS', 'Termos e Condições de Uso da Bella Aurora. Conheça as regras para utilização de nossos serviços.');