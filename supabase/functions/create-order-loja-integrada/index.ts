import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderData {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: any;
  notes?: string;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  total: number;
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
      const errorText = await response.text();
      console.error(`Loja Integrada API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Loja Integrada API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async createOrder(orderData: any) {
    return this.makeRequest('/pedido', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('ID do pedido é obrigatório');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const apiKey = Deno.env.get('LOJA_INTEGRADA_API_KEY');
    const appKey = Deno.env.get('LOJA_INTEGRADA_APP_KEY');

    if (!apiKey || !appKey) {
      console.warn('API keys da Loja Integrada não configuradas - pedido não será enviado');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pedido criado localmente (integração Loja Integrada não configurada)',
          orderId 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, sku, price)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Erro ao buscar pedido: ${orderError?.message}`);
    }

    // Buscar dados do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', order.user_id)
      .single();

    const lojaAPI = new LojaIntegradaAPI(apiKey, appKey);

    // Preparar dados do pedido para a Loja Integrada
    const shippingAddress = order.shipping_address || {};
    
    const lojaOrderData = {
      numero: order.order_number,
      situacao: {
        codigo: 'aguardando_pagamento'
      },
      cliente: {
        nome: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Cliente',
        email: shippingAddress.email || 'cliente@exemplo.com',
        telefone: profile?.phone || shippingAddress.phone || '',
        cpf: shippingAddress.document || '',
        endereco: {
          endereco: shippingAddress.street || '',
          numero: shippingAddress.number || '',
          complemento: shippingAddress.complement || '',
          bairro: shippingAddress.neighborhood || '',
          cidade: shippingAddress.city || '',
          estado: shippingAddress.state || '',
          cep: shippingAddress.zip_code || '',
        }
      },
      forma_pagamento: {
        nome: mapPaymentMethod(order.payment_method)
      },
      valor_subtotal: order.subtotal.toString(),
      valor_envio: order.shipping_cost.toString(),
      valor_total: order.total.toString(),
      obs: order.notes || '',
      itens: order.order_items.map((item: any) => ({
        produto: {
          nome: item.products?.name || 'Produto',
          codigo: item.products?.sku || `PROD-${item.product_id}`,
        },
        quantidade: item.quantity,
        preco_unitario: item.price.toString(),
        preco_total: item.total.toString(),
      }))
    };

    console.log('Enviando pedido para Loja Integrada:', JSON.stringify(lojaOrderData, null, 2));

    // Criar pedido na Loja Integrada
    const lojaOrder = await lojaAPI.createOrder(lojaOrderData);
    
    console.log('Pedido criado na Loja Integrada:', lojaOrder);

    // Atualizar pedido local com dados da Loja Integrada
    if (lojaOrder.numero) {
      await supabaseClient
        .from('orders')
        .update({
          notes: `${order.notes || ''}\nID Loja Integrada: ${lojaOrder.numero}`.trim()
        })
        .eq('id', orderId);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Pedido enviado para Loja Integrada com sucesso',
        orderId,
        lojaIntegradaId: lojaOrder.numero || lojaOrder.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Erro ao criar pedido na Loja Integrada:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Erro ao enviar pedido para Loja Integrada'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

function mapPaymentMethod(method: string): string {
  const methodMap: { [key: string]: string } = {
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'bank_slip': 'Boleto Bancário',
    'pix': 'PIX',
    'cash': 'Dinheiro',
  };
  return methodMap[method] || 'Cartão de Crédito';
}