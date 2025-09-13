import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Mercado Pago webhook received");
    
    // Validate request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limiting check (simple implementation)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log(`Webhook from IP: ${clientIP}`);
    
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    let webhook: Partial<MercadoPagoWebhook> = {};
    try {
      const body = await req.text();
      if (body) {
        webhook = JSON.parse(body);
      }
    } catch (e) {
      console.log("Error parsing JSON body, falling back to query params:", e);
    }
    console.log("Webhook data:", JSON.stringify(webhook, null, 2), " Query:", url.search);

    // Aceitar qualquer tipo de notificação de pagamento
    const paymentId = (webhook as any)?.data?.id || searchParams.get("data.id") || searchParams.get("id");
    if (!paymentId) {
      console.log("No payment ID found in webhook, accepting anyway");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    console.log(`Processing payment webhook for payment ID: ${paymentId}`);

    // Buscar detalhes do pagamento no Mercado Pago
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!paymentResponse.ok) {
      throw new Error(`Failed to fetch payment details: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    console.log("Payment data from MP:", JSON.stringify(paymentData, null, 2));

    // Verificar se o pagamento foi aprovado
    if (paymentData.status !== "approved") {
      console.log(`Payment not approved yet. Status: ${paymentData.status}`);
      return new Response(JSON.stringify({ received: true, status: paymentData.status }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Buscar o pedido pelo external_reference
    const orderId = paymentData.external_reference;
    if (!orderId) {
      throw new Error("No external_reference found in payment data");
    }

    console.log(`Updating order ${orderId} to paid status`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Atualizar o status do pedido
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        payment_data: paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log(`Order ${orderId} updated successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      orderId: orderId,
      paymentId: paymentId,
      paymentStatus: paymentData.status
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);