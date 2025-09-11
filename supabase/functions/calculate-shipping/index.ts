import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShippingRequest {
  destCep: string;
  originCep?: string;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destCep, originCep = "13480678", weight = 0.1, height = 6, width = 12, length = 18 }: ShippingRequest = await req.json();

    console.log('Calculando frete:', { destCep, originCep, weight, height, width, length });

    // Validar CEP de destino
    if (!destCep || destCep.replace(/\D/g, '').length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP de destino inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const cleanDestCep = destCep.replace(/\D/g, '');
    const cleanOriginCep = originCep.replace(/\D/g, '');

    // Consultar API dos Correios via ViaCEP + Melhor Envio ou API pública
    // Como a API oficial dos Correios não é pública, vamos usar uma estratégia híbrida
    
    // 1. Primeiro validar o CEP via ViaCEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanDestCep}/json/`);
    
    if (!viaCepResponse.ok) {
      throw new Error('Erro ao validar CEP');
    }

    const cepData = await viaCepResponse.json();
    
    if (cepData.erro) {
      return new Response(
        JSON.stringify({ error: 'CEP não encontrado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Calcular frete baseado na região e distância
    const calculateShippingCost = (originState: string, destState: string, destRegion: string) => {
      let basePrice = 15.50;
      let baseDays = 5;

      // Mesma cidade/região
      if (originState === destState) {
        if (destRegion === "13") { // Limeira e região
          basePrice = 8.50;
          baseDays = 2;
        } else {
          basePrice = 12.50; // Mesmo estado
          baseDays = 3;
        }
      }
      // Estados próximos (Sudeste/Sul)
      else if (['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(destState)) {
        if (['RJ', 'MG', 'ES'].includes(destState)) {
          basePrice = 18.50; // Sudeste próximo
          baseDays = 4;
        } else {
          basePrice = 22.80; // Sul
          baseDays = 6;
        }
      }
      // Centro-Oeste
      else if (['GO', 'MT', 'MS', 'DF'].includes(destState)) {
        basePrice = 26.90;
        baseDays = 7;
      }
      // Nordeste
      else if (['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'].includes(destState)) {
        basePrice = 32.90;
        baseDays = 9;
      }
      // Norte
      else {
        basePrice = 38.90;
        baseDays = 12;
      }

      // Ajustar por peso (acima de 100g)
      if (weight > 0.1) {
        const extraWeight = weight - 0.1;
        basePrice += extraWeight * 5; // R$ 5 por 100g adicional
      }

      // Adicionar 48h conforme solicitado
      baseDays += 2;

      return { price: basePrice, days: baseDays };
    };

    const result = calculateShippingCost("SP", cepData.uf, cleanDestCep.substring(0, 2));

    console.log('Resultado do cálculo:', result);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          price: result.price,
          days: result.days,
          service: 'Sedex',
          destination: {
            city: cepData.localidade,
            state: cepData.uf,
            neighborhood: cepData.bairro || '',
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});