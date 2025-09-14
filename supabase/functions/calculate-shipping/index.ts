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
      let basePriceSedex = 20.50; // Valor base Sedex
      let baseDaysSedex = 4;

      // São Paulo capital (região 01-05)
      if (destState === 'SP' && ['01', '02', '03', '04', '05'].includes(destRegion)) {
        basePriceSedex = 12.50; // Baseado na HubJoias para SP capital
        baseDaysSedex = 3;
      }
      // São Paulo interior (Limeira e região próxima)
      else if (destState === 'SP' && destRegion === "13") { 
        basePriceSedex = 15.50;
        baseDaysSedex = 2;
      }
      // São Paulo - outras regiões
      else if (destState === 'SP') {
        basePriceSedex = 16.50;
        baseDaysSedex = 3;
      }
      // Rio de Janeiro
      else if (destState === 'RJ') {
        basePriceSedex = 22.50;
        baseDaysSedex = 4;
      }
      // Minas Gerais
      else if (destState === 'MG') {
        basePriceSedex = 24.50;
        baseDaysSedex = 4;
      }
      // Espírito Santo
      else if (destState === 'ES') {
        basePriceSedex = 26.50;
        baseDaysSedex = 5;
      }
      // Sul - Paraná e Santa Catarina
      else if (['PR', 'SC'].includes(destState)) {
        basePriceSedex = 28.80;
        baseDaysSedex = 5;
      }
      // Rio Grande do Sul
      else if (destState === 'RS') {
        basePriceSedex = 35.50; // Valor mais realista para RS
        baseDaysSedex = 6;
      }
      // Centro-Oeste
      else if (['GO', 'MT', 'MS', 'DF'].includes(destState)) {
        basePriceSedex = 32.90;
        baseDaysSedex = 6;
      }
      // Nordeste
      else if (['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'].includes(destState)) {
        basePriceSedex = 38.90;
        baseDaysSedex = 8;
      }
      // Norte
      else {
        basePriceSedex = 42.90;
        baseDaysSedex = 10;
      }

      // Ajustar por peso (acima de 100g)
      if (weight > 0.1) {
        const extraWeight = weight - 0.1;
        basePriceSedex += extraWeight * 5; // R$ 5 por 100g adicional
      }

      // Calcular PAC baseado na referência da HubJoias
      // PAC é cerca de 55% mais caro que Sedex (R$ 19,47 vs R$ 12,53)
      const basePricePac = Math.round(basePriceSedex * 1.55 * 100) / 100;
      const baseDaysPac = baseDaysSedex + 4; // PAC demora 4 dias a mais

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