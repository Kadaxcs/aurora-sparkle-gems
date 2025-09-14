import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface SizeSelectorProps {
  productId: string;
  productName: string;
  availableSizes: number[];
  onAddToCart: (productId: string, quantity: number, size?: string) => void;
  trigger?: React.ReactNode;
}

export const SizeSelector = ({ 
  productId, 
  productName, 
  availableSizes, 
  onAddToCart, 
  trigger 
}: SizeSelectorProps) => {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const handleAddToCart = () => {
    if (selectedSize) {
      onAddToCart(productId, 1, selectedSize.toString());
      setOpen(false);
      setSelectedSize(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecione o Tamanho</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha o tamanho do anel: <strong>{productName}</strong>
          </p>
          
          <div className="grid grid-cols-4 gap-2">
            {availableSizes.map((size) => (
              <Button
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                className="h-12"
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className="bg-primary hover:bg-primary/90"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};