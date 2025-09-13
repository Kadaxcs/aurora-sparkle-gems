import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerEmailRequest {
  orderId: string;
  emailType: 'confirmation' | 'payment_confirmed' | 'processing' | 'shipped' | 'delivered';
  trackingCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, emailType, trackingCode }: CustomerEmailRequest = await req.json();

    console.log(`Processing customer email for order: ${orderId}, type: ${emailType}`);

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
            images,
            sku
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      throw new Error(`Pedido não encontrado: ${orderError?.message}`);
    }

    // Fetch profile separately to avoid schema cache issues
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('user_id', order.user_id)
      .single();

    // Get customer email from auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(order.user_id);
    
    if (userError || !user?.user?.email) {
      console.error('Error fetching user email:', userError);
      throw new Error('Email do cliente não encontrado');
    }

    const customerEmail = user.user.email;
    const customerName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente' : 'Cliente';
    
    // Generate email content based on type
    const emailContent = generateEmailContent(order, emailType, customerName, trackingCode);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Bella Aurora <pedidos@bellaaurora.com.br>",
      to: [customerEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Customer email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email enviado ao cliente com sucesso',
      order: order.order_number,
      emailId: emailResponse.id,
      emailType: emailType
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in customer email function:", error);
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

function generateEmailContent(order: any, emailType: string, customerName: string, trackingCode?: string) {
  const orderItems = order.order_items || [];
  
  // Generate products list
  const productsList = orderItems.map((item: any) => {
    const product = item.products;
    const imageHtml = product?.images && Array.isArray(product.images) && product.images[0] 
      ? `<img src="${product.images[0]}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`
      : `<div style="width: 60px; height: 60px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">Sem imagem</div>`;
    
    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 15px 8px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${imageHtml}
            <div>
              <p style="margin: 0; font-weight: 600; color: #333;">${product?.name || 'Produto'}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">Qtd: ${item.quantity} × R$ ${item.price.toFixed(2)}</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px 8px; text-align: right; border-bottom: 1px solid #eee;">
          <strong style="color: #333;">R$ ${item.total.toFixed(2)}</strong>
        </td>
      </tr>
    `;
  }).join('');

  // Format shipping address
  const shippingAddress = order.shipping_address;
  const addressHtml = shippingAddress ? `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #D4A574;">
      <h3 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">📍 Endereço de Entrega</h3>
      <p style="margin: 0; line-height: 1.6; color: #555;">
        ${shippingAddress.street}, ${shippingAddress.number}<br>
        ${shippingAddress.complement ? `${shippingAddress.complement}<br>` : ''}
        ${shippingAddress.neighborhood} - ${shippingAddress.city}, ${shippingAddress.state}<br>
        CEP: ${shippingAddress.zip_code}
      </p>
    </div>
  ` : '';

  const baseTemplate = (content: string, headerTitle: string, headerIcon: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerTitle} - Bella Aurora</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #D4A574 0%, #B8956A 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 300;">
          ${headerIcon} Bella Aurora
        </h1>
        <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${headerTitle}</p>
      </div>

      <!-- Main Content -->
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 20px;">
        
        <!-- Greeting -->
        <div style="padding: 30px 30px 20px 30px;">
          <h2 style="margin: 0 0 16px 0; color: #333; font-size: 24px; font-weight: 600;">
            Olá, ${customerName}! 👋
          </h2>
          ${content}
        </div>

        <!-- Order Summary -->
        <div style="padding: 0 30px 20px 30px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid #D4A574;">
            <h3 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">📋 Resumo do Pedido #${order.order_number}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #666;">Data do Pedido:</span>
              <span style="font-weight: 600;">${new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #666;">Forma de Pagamento:</span>
              <span style="font-weight: 600;">${getPaymentMethodLabel(order.payment_method)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666; font-size: 18px;">Total:</span>
              <span style="font-weight: 700; color: #D4A574; font-size: 20px;">R$ ${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Products -->
        <div style="padding: 0 30px 20px 30px;">
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">🛍️ Seus Produtos</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${productsList}
            </tbody>
          </table>
          
          <!-- Order totals -->
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Subtotal:</span>
              <span>R$ ${order.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span>Frete:</span>
              <span>R$ ${order.shipping_cost.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #D4A574; border-top: 1px solid #ddd; padding-top: 12px;">
              <span>Total:</span>
              <span>R$ ${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        ${addressHtml ? `<div style="padding: 0 30px 20px 30px;">${addressHtml}</div>` : ''}

        <!-- Contact Info -->
        <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #eee;">
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">💬 Precisa de Ajuda?</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: 600; color: #D4A574;">📧 Email</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;">contato@bellaaurora.com.br</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: 600; color: #D4A574;">📱 WhatsApp</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;">(11) 99999-9999</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: #fff; padding: 20px 30px; text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            © 2024 Bella Aurora - Joias que contam sua história
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.6;">
            Este é um email automático, não responda a esta mensagem.
          </p>
        </div>

      </div>

      <!-- Bottom spacing -->
      <div style="height: 30px;"></div>

    </body>
    </html>
  `;

  switch (emailType) {
    case 'confirmation':
      return {
        subject: `✅ Pedido Confirmado #${order.order_number} - Bella Aurora`,
        html: baseTemplate(`
          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            Seu pedido foi <strong>confirmado com sucesso</strong>! 🎉
          </p>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
            Estamos preparando tudo com muito carinho para você. Em breve você receberá a confirmação do pagamento 
            e atualizações sobre o status do seu pedido.
          </p>
        `, 'Pedido Confirmado', '✅')
      };

    case 'payment_confirmed':
      return {
        subject: `💳 Pagamento Confirmado #${order.order_number} - Bella Aurora`,
        html: baseTemplate(`
          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            Ótimas notícias! Seu <strong>pagamento foi confirmado</strong>! 💳✨
          </p>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
            Agora vamos preparar suas joias com todo cuidado e amor. O prazo de entrega é de 
            <strong>7 a 15 dias úteis</strong> após a confirmação do pagamento.
          </p>
          <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h4 style="margin: 0 0 12px 0; color: #2e7d32;">🚀 Próximos Passos:</h4>
            <ul style="margin: 0; color: #2e7d32; padding-left: 20px;">
              <li>Separação dos produtos</li>
              <li>Embalagem especial</li>
              <li>Envio para o endereço cadastrado</li>
              <li>Você receberá o código de rastreamento</li>
            </ul>
          </div>
        `, 'Pagamento Confirmado', '💳')
      };

    case 'processing':
      return {
        subject: `📦 Pedido em Preparação #${order.order_number} - Bella Aurora`,
        html: baseTemplate(`
          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            Seu pedido está sendo <strong>preparado com muito carinho</strong>! 📦✨
          </p>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
            Nossa equipe está separando e embalando suas joias especiais. 
            Em breve elas estarão a caminho do seu endereço!
          </p>
        `, 'Pedido em Preparação', '📦')
      };

    case 'shipped':
      return {
        subject: `🚚 Pedido Enviado #${order.order_number} - Bella Aurora`,
        html: baseTemplate(`
          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            Suas joias estão <strong>a caminho</strong>! 🚚💎
          </p>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
            Seu pedido foi enviado e está sendo transportado com todo cuidado até você.
            ${trackingCode ? `Use o código de rastreamento abaixo para acompanhar:` : ''}
          </p>
          ${trackingCode ? `
            <div style="background: #fff3cd; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #ffc107; text-align: center;">
              <h4 style="margin: 0 0 12px 0; color: #856404;">📋 Código de Rastreamento</h4>
              <p style="margin: 0; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace; color: #856404;">${trackingCode}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">
                Acompanhe no site dos Correios ou da transportadora
              </p>
            </div>
          ` : ''}
        `, 'Pedido Enviado', '🚚')
      };

    case 'delivered':
      return {
        subject: `🎉 Pedido Entregue #${order.order_number} - Bella Aurora`,
        html: baseTemplate(`
          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            Suas joias foram <strong>entregues</strong>! 🎉💎
          </p>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
            Esperamos que você ame suas novas joias tanto quanto nós amamos criá-las! 
            Se tiver alguma dúvida ou precisar de alguma coisa, não hesite em nos contatar.
          </p>
          <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #4caf50; text-align: center;">
            <h4 style="margin: 0 0 12px 0; color: #2e7d32;">⭐ Conta pra gente!</h4>
            <p style="margin: 0; color: #2e7d32; line-height: 1.6;">
              Adoraríamos ver como ficaram em você! Marque-nos nas redes sociais 
              e compartilhe sua experiência com a Bella Aurora. 💝
            </p>
          </div>
        `, 'Pedido Entregue', '🎉')
      };

    default:
      throw new Error(`Tipo de email não suportado: ${emailType}`);
  }
}

function getPaymentMethodLabel(method: string) {
  const methodMap = {
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito", 
    pix: "PIX",
    boleto: "Boleto Bancário",
  };
  
  return methodMap[method as keyof typeof methodMap] || method;
}

serve(handler);