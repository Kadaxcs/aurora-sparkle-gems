import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Clock, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FreightResult {
  price: number;
  days: number;
  error?: string;
}

interface FreightCalculatorProps {
  subtotal: number;
  onFreightCalculated: (freight: FreightResult | null) => void;
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
      // Configurações fixas
      const originCep = "13480678"; // Limeira-SP
      const weight = 0.1; // 100g
      const height = 6;
      const width = 12;
      const length = 18;

      // Simulação da API dos Correios - em produção usar API real
      const mockCalculation = () => {
        // Simular diferentes preços baseado na distância (primeiros dígitos do CEP)
        const destRegion = parseInt(cleanCep.substring(0, 2));
        const originRegion = 13; // SP
        
        let basePrice = 15.50;
        let baseDays = 5;

        // Calcular baseado na região
        const distance = Math.abs(destRegion - originRegion);
        
        if (distance === 0) {
          basePrice = 12.50; // Mesmo estado
          baseDays = 3;
        } else if (distance <= 2) {
          basePrice = 15.50; // Estados próximos
          baseDays = 5;
        } else if (distance <= 5) {
          basePrice = 22.80; // Região sudeste/sul
          baseDays = 7;
        } else {
          basePrice = 28.90; // Outras regiões
          baseDays = 10;
        }

        // Adicionar 48h conforme solicitado
        baseDays += 2;

        return {
          price: basePrice,
          days: baseDays
        };
      };

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = mockCalculation();
      
      const freightData: FreightResult = {
        price: result.price,
        days: result.days
      };

      setFreightResult(freightData);
      onFreightCalculated(freightData);

      toast({
        title: "Frete calculado",
        description: `R$ ${result.price.toFixed(2)} - ${result.days} dias úteis`,
      });

    } catch (error) {
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

            {freightResult && !freightResult.error && (
              <div className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sedex:</span>
                  <span className="font-bold text-primary">
                    R$ {freightResult.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Entrega em até {freightResult.days} dias úteis</span>
                </div>
                <div className="text-xs text-muted-foreground">
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