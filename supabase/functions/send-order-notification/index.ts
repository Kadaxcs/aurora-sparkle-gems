import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  adminEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    let body: OrderNotificationRequest | null = null;
    try {
      body = await req.json();
    } catch (_) {
      body = null;
    }

    if (!body || !body.orderId) {
      return new Response(JSON.stringify({ error: "Invalid or missing JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { orderId, adminEmail = "kadaxyz1@gmail.com" } = body;

    console.log(`Processing order notification for order: ${orderId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch order details with related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          total,
          products (
            name,
            sku,
            weight
          )
        ),
        profiles (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', orderId)
      .eq('payment_status', 'paid')
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      throw new Error(`Pedido não encontrado: ${orderError.message}`);
    }

    if (!order) {
      throw new Error('Pedido não encontrado ou não está pago');
    }

    console.log(`Order found: ${order.order_number}`);

    // Format order data for email
    const customerName = `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || 'Cliente';
    const shippingAddress = order.shipping_address;
    const orderItems = order.order_items || [];

    // Calculate total weight
    const totalWeight = orderItems.reduce((sum: number, item: any) => {
      const weight = item.products?.weight || 0;
      return sum + (weight * item.quantity);
    }, 0);

    // Generate products list for email
    const productsList = orderItems.map((item: any) => {
      const product = item.products;
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border: 1px solid #ddd;">${product?.name || 'Produto'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${(product?.weight || 0).toFixed(1)}g</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product?.sku || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${item.total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Format shipping address
    const addressHtml = shippingAddress ? `
      <h3 style="color: #333; margin-top: 20px;">📍 Endereço de Entrega:</h3>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <strong>${shippingAddress.street}, ${shippingAddress.number}</strong><br>
        ${shippingAddress.complement ? `${shippingAddress.complement}<br>` : ''}
        ${shippingAddress.neighborhood} - ${shippingAddress.city}, ${shippingAddress.state}<br>
        CEP: ${shippingAddress.zip_code}<br>
        ${shippingAddress.country || 'Brasil'}
      </div>
    ` : '<p style="color: #e74c3c;">❌ Endereço de entrega não informado</p>';

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>🔔 Novo Pedido Pago - ${order.order_number}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Novo Pedido Pago!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${order.order_number}</p>
        </div>

        <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">📋 Informações do Pedido</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p><strong>👤 Cliente:</strong> ${customerName}</p>
              <p><strong>📞 Telefone:</strong> ${order.profiles?.phone || 'Não informado'}</p>
              <p><strong>📧 Email:</strong> ${order.user_id ? 'Disponível no admin' : 'Não disponível'}</p>
            </div>
            <div>
              <p><strong>📅 Data:</strong> ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
              <p><strong>💰 Total:</strong> R$ ${order.total.toFixed(2)}</p>
              <p><strong>⚖️ Peso Total:</strong> ${totalWeight.toFixed(1)}g</p>
            </div>
          </div>
        </div>

        ${addressHtml}

        <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">🛍️ Produtos do Pedido:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Produto</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Qtd</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Peso</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">SKU</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
        </div>

        <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">✅ Próximos Passos:</h3>
          <ol style="color: #2e7d32; margin: 0;">
            <li>Verificar estoque dos produtos</li>
            <li>Contatar distribuidor para separação</li>
            <li>Agendar envio para o endereço acima</li>
            <li>Atualizar status do pedido no admin</li>
          </ol>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin-top: 20px; border-left: 4px solid #667eea;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            📊 Acesse o <strong>painel admin</strong> para mais detalhes e gestão do pedido
          </p>
        </div>

      </body>
      </html>
    `;

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "Bella Aurora <pedidos@bellaaurora.com.br>",
      to: [adminEmail],
      subject: `🔔 Novo Pedido Pago - ${order.order_number} - R$ ${order.total.toFixed(2)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email de notificação enviado com sucesso',
      order: order.order_number,
      emailId: emailResponse.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in order notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);