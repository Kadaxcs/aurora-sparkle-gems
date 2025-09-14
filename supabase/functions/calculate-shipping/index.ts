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

    // 2. Calcular frete baseado na região e distância com valores mais reais
    const calculateShippingOptions = (originState: string, destState: string, destRegion: string) => {
      let basePriceSedex = 25.50; // Valor base Sedex
      let baseDaysSedex = 5;

      // Mesma cidade/região
      if (originState === destState) {
        if (destRegion === "13") { // Limeira e região
          basePriceSedex = 15.50;
          baseDaysSedex = 2;
        } else {
          basePriceSedex = 19.50; // Mesmo estado
          baseDaysSedex = 3;
        }
      }
      // Estados próximos (Sudeste/Sul)
      else if (['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(destState)) {
        if (['RJ', 'MG', 'ES'].includes(destState)) {
          basePriceSedex = 28.50; // Sudeste próximo
          baseDaysSedex = 4;
        } else if (['RS'].includes(destState)) {
          // Rio Grande do Sul - valor específico baseado no exemplo
          basePriceSedex = 46.50; // Baseado no valor da HubJoias
          baseDaysSedex = 8;
        } else {
          basePriceSedex = 35.80; // Sul geral
          baseDaysSedex = 6;
        }
      }
      // Centro-Oeste
      else if (['GO', 'MT', 'MS', 'DF'].includes(destState)) {
        basePriceSedex = 38.90;
        baseDaysSedex = 7;
      }
      // Nordeste
      else if (['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'].includes(destState)) {
        basePriceSedex = 42.90;
        baseDaysSedex = 9;
      }
      // Norte
      else {
        basePriceSedex = 48.90;
        baseDaysSedex = 12;
      }

      // Ajustar por peso (acima de 100g)
      if (weight > 0.1) {
        const extraWeight = weight - 0.1;
        basePriceSedex += extraWeight * 7; // R$ 7 por 100g adicional (mais realista)
      }

      // Margem de segurança de 10% para cobrir flutuações
      basePriceSedex = Math.round(basePriceSedex * 1.1 * 100) / 100;

      // Adicionar 48h conforme solicitado
      baseDaysSedex += 2;

      // Calcular PAC (30% mais barato, 3-5 dias a mais)
      const basePricePac = Math.round(basePriceSedex * 0.7 * 100) / 100;
      const baseDaysPac = baseDaysSedex + Math.min(5, Math.max(3, Math.round(baseDaysSedex * 0.3)));

      return [
        {
          service: 'PAC',
          price: basePricePac,
          days: baseDaysPac
        },
        {
          service: 'Sedex',
          price: basePriceSedex,
          days: baseDaysSedex
        }
      ];
    };

    const options = calculateShippingOptions("SP", cepData.uf, cleanDestCep.substring(0, 2));

    console.log('Opções de frete calculadas:', options);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          options: options,
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