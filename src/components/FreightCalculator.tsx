import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Clock, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShippingOption {
  service: string;
  price: number;
  days: number;
}

interface FreightResult {
  options?: ShippingOption[];
  price?: number;
  days?: number;
  error?: string;
}

interface FreightCalculatorProps {
  subtotal: number;
  onFreightCalculated: (freight: { cost: number; days: number; service: string } | null) => void;
  initialCep?: string;
}

export const FreightCalculator: React.FC<FreightCalculatorProps> = ({
  subtotal,
  onFreightCalculated,
  initialCep = ""
}) => {
  const [cep, setCep] = useState(initialCep);
  const [isCalculating, setIsCalculating] = useState(false);
  const [freightResult, setFreightResult] = useState<FreightResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const { toast } = useToast();

  const formatCep = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 8) {
      return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cleanValue.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
  };

  const calculateFreight = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Digite um CEP válido com 8 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      // Chamar edge function para calcular frete real
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: {
          destCep: cleanCep,
          originCep: "13480678", // Limeira-SP
          weight: 0.1, // 100g
          height: 6,
          width: 12,
          length: 18
        }
      });

      if (error) throw error;

      if (data?.success && data.data?.options) {
        const freightData: FreightResult = {
          options: data.data.options
        };

        setFreightResult(freightData);
        
        // Selecionar automaticamente a opção mais barata (PAC)
        const cheapestOption = data.data.options.reduce((prev: ShippingOption, current: ShippingOption) => 
          prev.price < current.price ? prev : current
        );
        setSelectedOption(cheapestOption);
        onFreightCalculated({ 
          cost: cheapestOption.price, 
          days: cheapestOption.days,
          service: cheapestOption.service
        });

        toast({
          title: "Opções de frete calculadas!",
          description: `${data.data.options.length} opções disponíveis`,
        });
      } else {
        throw new Error(data?.error || 'Erro ao calcular frete');
      }

    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      
      const errorResult: FreightResult = {
        price: 0,
        days: 0,
        error: "Erro ao calcular frete"
      };
      
      setFreightResult(errorResult);
      onFreightCalculated(null);
      
      toast({
        title: "Erro",
        description: "Não foi possível calcular o frete. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const isFreeShipping = subtotal >= 299;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Calcular Frete
        </CardTitle>
        <CardDescription>
          {isFreeShipping 
            ? "🎉 Frete GRÁTIS para compras acima de R$ 299!" 
            : "Digite seu CEP para calcular o frete"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isFreeShipping && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP de destino</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  type="text"
                  placeholder="00000-000"
                  value={cep}
                  onChange={handleCepChange}
                  maxLength={9}
                />
                <Button 
                  onClick={calculateFreight}
                  disabled={isCalculating || cep.replace(/\D/g, '').length !== 8}
                  size="sm"
                >
                  {isCalculating ? (
                    <Calculator className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {freightResult && !freightResult.error && freightResult.options && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Opções de frete:</p>
                <div className="space-y-2">
                  {freightResult.options.map((option, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedOption?.service === option.service 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedOption(option);
                        onFreightCalculated({ 
                          cost: option.price, 
                          days: option.days,
                          service: option.service
                        });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{option.service}</span>
                            {option.service === 'PAC' && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded">
                                Mais econômico
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{option.days} dias úteis</span>
                          </div>
                        </div>
                        <span className="font-bold text-primary">R$ {option.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  Origem: Limeira-SP | Dimensões: 18x12x6cm | Peso: 100g
                </div>
              </div>
            )}
          </>
        )}

        {isFreeShipping && (
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg text-center">
            <div className="text-green-800 dark:text-green-200 font-medium">
              Frete Grátis para todo o Brasil! 🚚✨
            </div>
            <div className="text-sm text-green-600 dark:text-green-300 mt-1">
              Entrega em até 7 dias úteis
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};