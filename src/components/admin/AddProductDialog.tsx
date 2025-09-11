import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "./RichTextEditor";
import { MediaUploader } from "./MediaUploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: () => void;
  categories: Category[];
}

export function AddProductDialog({ 
  open, 
  onOpenChange, 
  onProductCreated,
  categories 
}: ProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    short_description: "",
    sku: "",
    price: "",
    sale_price: "",
    cost_price: "",
    stock_quantity: "",
    weight: "",
    material: "",
    category_id: "",
    is_active: true,
    is_featured: false,
    dimensions: { length: "", width: "", height: "" },
    available_sizes: [] as (string | number)[],
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gerar slug a partir do nome
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      const productData = {
        name: formData.name,
        slug,
        description: formData.description || null,
        short_description: formData.short_description || null,
        sku: formData.sku || null,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        material: formData.material || null,
        category_id: formData.category_id || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        images: media.map(item => item.url),
        dimensions: (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height) ? {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null,
        } : null,
        available_sizes: formData.available_sizes,
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto criado com sucesso",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        short_description: "",
        sku: "",
        price: "",
        sale_price: "",
        cost_price: "",
        stock_quantity: "",
        weight: "",
        material: "",
        category_id: "",
        is_active: true,
        is_featured: false,
        dimensions: { length: "", width: "", height: "" },
        available_sizes: [],
      });
      setMedia([]);

      onProductCreated();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar produto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha as informações do produto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Descrição Curta</Label>
            <Input
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Completa</Label>
            <RichTextEditor
              content={formData.description}
              onChange={(content) => setFormData({ ...formData, description: content })}
              placeholder="Digite a descrição completa do produto..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Preço de Custo</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço de Venda *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_price">Preço Promocional</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Estoque</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (gramas)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Ex: Ouro 18k, Prata 925"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dimensões (cm)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Comprimento"
                type="number"
                step="0.01"
                value={formData.dimensions.length}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  dimensions: { ...formData.dimensions, length: e.target.value }
                })}
              />
              <Input
                placeholder="Largura"
                type="number"
                step="0.01"
                value={formData.dimensions.width}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  dimensions: { ...formData.dimensions, width: e.target.value }
                })}
              />
              <Input
                placeholder="Altura"
                type="number"
                step="0.01"
                value={formData.dimensions.height}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  dimensions: { ...formData.dimensions, height: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tamanhos Disponíveis</Label>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {formData.available_sizes.map((size, index) => (
                  <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <span className="text-sm">{size}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => {
                        const newSizes = formData.available_sizes.filter((_, i) => i !== index);
                        setFormData({ ...formData, available_sizes: newSizes });
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="new-size"
                  placeholder="Adicionar tamanho (ex: 16, P, M, G)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !formData.available_sizes.includes(value)) {
                        const numValue = Number(value);
                        const newSize = isNaN(numValue) ? value : numValue;
                        setFormData({ 
                          ...formData, 
                          available_sizes: [...formData.available_sizes, newSize]
                        });
                        input.value = '';
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('new-size') as HTMLInputElement;
                    const value = input.value.trim();
                    if (value && !formData.available_sizes.includes(value)) {
                      const numValue = Number(value);
                      const newSize = isNaN(numValue) ? value : numValue;
                      setFormData({ 
                        ...formData, 
                        available_sizes: [...formData.available_sizes, newSize]
                      });
                      input.value = '';
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Para anéis: use números (14, 16, 18, 20, 22). Para roupas: use letras (P, M, G, XG).
              </p>
            </div>
          </div>

          <MediaUploader
            media={media}
            onChange={setMedia}
            maxItems={10}
          />

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Produto Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured">Produto em Destaque</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}