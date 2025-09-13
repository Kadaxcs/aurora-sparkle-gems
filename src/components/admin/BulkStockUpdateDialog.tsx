import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BulkStockUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  onSuccess: () => void;
}

export function BulkStockUpdateDialog({
  open,
  onOpenChange,
  selectedProductIds,
  onSuccess,
}: BulkStockUpdateDialogProps) {
  const [updateType, setUpdateType] = useState<"set" | "add" | "subtract">("set");
  const [stockValue, setStockValue] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!stockValue || isNaN(Number(stockValue))) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor numérico válido",
        variant: "destructive",
      });
      return;
    }

    const value = Number(stockValue);
    if (value < 0) {
      toast({
        title: "Erro",
        description: "O valor não pode ser negativo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (updateType === "set") {
        // Definir estoque específico
        const { error } = await supabase
          .from('products')
          .update({ stock_quantity: value })
          .in('id', selectedProductIds);

        if (error) throw error;
      } else {
        // Para adicionar ou subtrair, primeiro buscar os valores atuais
        const { data: products, error: fetchError } = await supabase
          .from('products')
          .select('id, stock_quantity')
          .in('id', selectedProductIds);

        if (fetchError) throw fetchError;

        // Atualizar cada produto individualmente
        const updates = products?.map(product => {
          let newStock;
          if (updateType === "add") {
            newStock = product.stock_quantity + value;
          } else {
            newStock = Math.max(0, product.stock_quantity - value);
          }

          return supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', product.id);
        });

        if (updates) {
          await Promise.all(updates);
        }
      }

      toast({
        title: "Sucesso",
        description: `Estoque atualizado para ${selectedProductIds.length} produto(s)`,
      });

      onSuccess();
      onOpenChange(false);
      setStockValue("");
      setUpdateType("set");
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Estoque em Massa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              {selectedProductIds.length} produto(s) selecionado(s)
            </Label>
          </div>

          <div>
            <Label htmlFor="update-type" className="text-sm font-medium">
              Tipo de Atualização
            </Label>
            <RadioGroup
              value={updateType}
              onValueChange={(value) => setUpdateType(value as "set" | "add" | "subtract")}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set" id="set" />
                <Label htmlFor="set">Definir estoque</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add">Adicionar ao estoque</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subtract" id="subtract" />
                <Label htmlFor="subtract">Remover do estoque</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="stock-value" className="text-sm font-medium">
              {updateType === "set" 
                ? "Novo valor do estoque"
                : updateType === "add"
                ? "Quantidade a adicionar"
                : "Quantidade a remover"
              }
            </Label>
            <Input
              id="stock-value"
              type="number"
              min="0"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              placeholder="Digite a quantidade"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || !stockValue}
          >
            {loading ? "Atualizando..." : "Atualizar Estoque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}