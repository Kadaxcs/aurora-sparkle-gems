import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LojaIntegradaProduct {
  id: number;
  ativo: number;
  nome: string;
  codigo: string;
  preco: string;
  preco_promocional?: string;
  descricao_completa?: string;
  descricao_resumida?: string;
  categoria?: {
    id: number;
    nome: string;
  };
  marca?: {
    id: number;
    nome: string;
  };
  estoque?: {
    quantidade: number;
  };
  imagens?: Array<{
    id: number;
    http: string;
    https: string;
  }>;
}

class LojaIntegradaAPI {
  private baseURL = 'https://api.awsli.com.br/v1';
  private apiKey: string;
  private appKey: string;

  constructor(apiKey: string, appKey: string) {
    this.apiKey = apiKey;
    this.appKey = appKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Basic ${btoa(`${this.apiKey}:${this.appKey}`)}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Loja Integrada API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getProducts(page = 1, limit = 50) {
    return this.makeRequest(`/produto?page=${page}&limit=${limit}`);
  }

  async getProduct(productId: number) {
    return this.makeRequest(`/produto/${productId}`);
  }

  async createProduct(product: any) {
    return this.makeRequest('/produto', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(productId: number, product: any) {
    return this.makeRequest(`/produto/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async getOrders(page = 1, limit = 50) {
    return this.makeRequest(`/pedido?page=${page}&limit=${limit}`);
  }

  async getOrder(orderId: number) {
    return this.makeRequest(`/pedido/${orderId}`);
  }

  async updateOrderStatus(orderId: number, status: any) {
    return this.makeRequest(`/pedido/${orderId}/situacao`, {
      method: 'PUT',
      body: JSON.stringify(status),
    });
  }

  async getCategories() {
    return this.makeRequest('/categoria');
  }

  async updateStock(productId: number, quantity: number) {
    return this.makeRequest(`/produto/${productId}/estoque`, {
      method: 'PUT',
      body: JSON.stringify({ quantidade: quantity }),
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const apiKey = Deno.env.get('LOJA_INTEGRADA_API_KEY');
    const appKey = Deno.env.get('LOJA_INTEGRADA_APP_KEY');

    if (!apiKey || !appKey) {
      throw new Error('API keys da Loja Integrada não configuradas');
    }

    const lojaAPI = new LojaIntegradaAPI(apiKey, appKey);

    switch (action) {
      case 'sync_products_from_loja':
        return await syncProductsFromLoja(lojaAPI, supabaseClient);
      
      case 'sync_products_to_loja':
        return await syncProductsToLoja(lojaAPI, supabaseClient);
      
      case 'sync_orders_from_loja':
        return await syncOrdersFromLoja(lojaAPI, supabaseClient);
      
      case 'sync_stock_to_loja':
        return await syncStockToLoja(lojaAPI, supabaseClient, data);
      
      case 'create_product_in_loja':
        return await createProductInLoja(lojaAPI, data);
      
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

  } catch (error) {
    console.error('Erro na integração Loja Integrada:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

async function syncProductsFromLoja(lojaAPI: LojaIntegradaAPI, supabaseClient: any) {
  console.log('Iniciando sincronização de produtos da Loja Integrada...');
  
  let page = 1;
  let totalSynced = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await lojaAPI.getProducts(page, 50);
    const products = response.objects || [];
    
    if (products.length === 0) {
      hasMorePages = false;
      break;
    }

    for (const lojaProduct of products) {
      try {
        // Verificar se a categoria existe
        let categoryId = null;
        if (lojaProduct.categoria) {
          const { data: category } = await supabaseClient
            .from('categories')
            .select('id')
            .eq('name', lojaProduct.categoria.nome)
            .single();
          
          if (!category) {
            // Criar categoria se não existir
            const { data: newCategory } = await supabaseClient
              .from('categories')
              .insert({
                name: lojaProduct.categoria.nome,
                slug: lojaProduct.categoria.nome.toLowerCase().replace(/\s+/g, '-'),
                is_active: true
              })
              .select('id')
              .single();
            categoryId = newCategory?.id;
          } else {
            categoryId = category.id;
          }
        }

        // Preparar dados do produto para o Supabase
        const productData = {
          name: lojaProduct.nome,
          slug: lojaProduct.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: lojaProduct.descricao_completa || lojaProduct.descricao_resumida,
          short_description: lojaProduct.descricao_resumida,
          sku: lojaProduct.codigo,
          price: parseFloat(lojaProduct.preco) || 0,
          sale_price: lojaProduct.preco_promocional ? parseFloat(lojaProduct.preco_promocional) : null,
          stock_quantity: lojaProduct.estoque?.quantidade || 0,
          is_active: lojaProduct.ativo === 1,
          category_id: categoryId,
          images: lojaProduct.imagens ? lojaProduct.imagens.map(img => img.https || img.http) : [],
        };

        // Verificar se o produto já existe (por SKU)
        const { data: existingProduct } = await supabaseClient
          .from('products')
          .select('id')
          .eq('sku', lojaProduct.codigo)
          .single();

        if (existingProduct) {
          // Atualizar produto existente
          await supabaseClient
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id);
        } else {
          // Criar novo produto
          await supabaseClient
            .from('products')
            .insert(productData);
        }

        totalSynced++;
        console.log(`Produto sincronizado: ${lojaProduct.nome}`);

      } catch (error) {
        console.error(`Erro ao sincronizar produto ${lojaProduct.nome}:`, error);
      }
    }

    page++;
    if (products.length < 50) {
      hasMorePages = false;
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Sincronização concluída. ${totalSynced} produtos sincronizados.`,
      totalSynced 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

async function syncProductsToLoja(lojaAPI: LojaIntegradaAPI, supabaseClient: any) {
  console.log('Iniciando sincronização de produtos para a Loja Integrada...');
  
  const { data: products, error } = await supabaseClient
    .from('products')
    .select(`
      *,
      categories (name)
    `)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Erro ao buscar produtos: ${error.message}`);
  }

  let totalSynced = 0;

  for (const product of products) {
    try {
      const lojaProductData = {
        nome: product.name,
        codigo: product.sku || `PROD-${product.id}`,
        preco: product.price.toString(),
        preco_promocional: product.sale_price ? product.sale_price.toString() : null,
        descricao_completa: product.description,
        descricao_resumida: product.short_description,
        ativo: product.is_active ? 1 : 0,
        categoria: product.categories ? { nome: product.categories.name } : null,
        estoque: { quantidade: product.stock_quantity || 0 },
      };

      // Tentar criar produto na Loja Integrada
      await lojaAPI.createProduct(lojaProductData);
      totalSynced++;
      console.log(`Produto enviado para Loja Integrada: ${product.name}`);

    } catch (error) {
      console.error(`Erro ao enviar produto ${product.name}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `${totalSynced} produtos enviados para a Loja Integrada.`,
      totalSynced 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

async function syncOrdersFromLoja(lojaAPI: LojaIntegradaAPI, supabaseClient: any) {
  console.log('Iniciando sincronização de pedidos da Loja Integrada...');
  
  let page = 1;
  let totalSynced = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await lojaAPI.getOrders(page, 50);
    const orders = response.objects || [];
    
    if (orders.length === 0) {
      hasMorePages = false;
      break;
    }

    for (const lojaOrder of orders) {
      try {
        // Verificar se o pedido já existe
        const { data: existingOrder } = await supabaseClient
          .from('orders')
          .select('id')
          .eq('order_number', `LI-${lojaOrder.numero}`)
          .single();

        if (!existingOrder) {
          // Criar novo pedido
          const orderData = {
            order_number: `LI-${lojaOrder.numero}`,
            user_id: null, // Será necessário mapear o cliente
            status: mapLojaStatus(lojaOrder.situacao?.nome),
            payment_status: mapLojaPaymentStatus(lojaOrder.forma_pagamento?.nome),
            payment_method: mapLojaPaymentMethod(lojaOrder.forma_pagamento?.nome),
            subtotal: parseFloat(lojaOrder.valor_subtotal) || 0,
            shipping_cost: parseFloat(lojaOrder.valor_envio) || 0,
            total: parseFloat(lojaOrder.valor_total) || 0,
            notes: lojaOrder.obs,
            shipping_address: lojaOrder.cliente ? {
              name: lojaOrder.cliente.nome,
              email: lojaOrder.cliente.email,
              phone: lojaOrder.cliente.telefone,
              street: lojaOrder.endereco_entrega?.endereco,
              number: lojaOrder.endereco_entrega?.numero,
              city: lojaOrder.endereco_entrega?.cidade,
              state: lojaOrder.endereco_entrega?.estado,
              zip_code: lojaOrder.endereco_entrega?.cep,
            } : null,
          };

          const { data: newOrder } = await supabaseClient
            .from('orders')
            .insert(orderData)
            .select('id')
            .single();

          // Criar itens do pedido
          if (newOrder && lojaOrder.itens) {
            for (const item of lojaOrder.itens) {
              await supabaseClient
                .from('order_items')
                .insert({
                  order_id: newOrder.id,
                  product_id: null, // Será necessário mapear pelo SKU
                  quantity: item.quantidade,
                  price: parseFloat(item.preco_unitario),
                  total: parseFloat(item.preco_total),
                });
            }
          }

          totalSynced++;
          console.log(`Pedido sincronizado: ${lojaOrder.numero}`);
        }

      } catch (error) {
        console.error(`Erro ao sincronizar pedido ${lojaOrder.numero}:`, error);
      }
    }

    page++;
    if (orders.length < 50) {
      hasMorePages = false;
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `${totalSynced} pedidos sincronizados da Loja Integrada.`,
      totalSynced 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

async function syncStockToLoja(lojaAPI: LojaIntegradaAPI, supabaseClient: any, data: any) {
  const { productId, quantity } = data;
  
  // Buscar produto no Supabase
  const { data: product } = await supabaseClient
    .from('products')
    .select('sku')
    .eq('id', productId)
    .single();

  if (!product || !product.sku) {
    throw new Error('Produto não encontrado ou sem SKU');
  }

  // Atualizar estoque na Loja Integrada (seria necessário ter o ID do produto na Loja Integrada)
  // Por simplicidade, assumindo que o SKU corresponde ao ID na Loja Integrada
  await lojaAPI.updateStock(parseInt(product.sku), quantity);

  return new Response(
    JSON.stringify({ message: 'Estoque atualizado na Loja Integrada' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

async function createProductInLoja(lojaAPI: LojaIntegradaAPI, productData: any) {
  const lojaProduct = await lojaAPI.createProduct(productData);
  
  return new Response(
    JSON.stringify({ 
      message: 'Produto criado na Loja Integrada',
      product: lojaProduct 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

// Funções auxiliares para mapear status
function mapLojaStatus(lojaStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'Aguardando pagamento': 'pending',
    'Aprovado': 'confirmed', 
    'Cancelado': 'cancelled',
    'Enviado': 'shipped',
    'Entregue': 'delivered',
  };
  return statusMap[lojaStatus] || 'pending';
}

function mapLojaPaymentStatus(paymentMethod: string): string {
  if (paymentMethod?.includes('Cartão')) return 'paid';
  if (paymentMethod?.includes('Boleto')) return 'pending';
  if (paymentMethod?.includes('PIX')) return 'paid';
  return 'pending';
}

function mapLojaPaymentMethod(paymentMethod: string): string {
  if (paymentMethod?.includes('Cartão')) return 'credit_card';
  if (paymentMethod?.includes('Boleto')) return 'bank_slip';
  if (paymentMethod?.includes('PIX')) return 'pix';
  return 'credit_card';
}