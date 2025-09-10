import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to products page with search query
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
      onOpenChange(false);
    }
  };

  const popularSearches = [
    "Anéis de noivado",
    "Brincos de pérola",
    "Colares de ouro",
    "Pulseiras delicadas",
    "Conjuntos completos"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Buscar Produtos</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Busque por joias, materiais, ocasiões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
              autoFocus
            />
          </div>
          
          <Button type="submit" className="w-full h-12">
            Buscar
          </Button>
        </form>

        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Buscas populares</h3>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(search);
                  window.location.href = `/products?search=${encodeURIComponent(search)}`;
                  onOpenChange(false);
                }}
                className="text-xs"
              >
                {search}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}