import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Product {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  weight?: number;
  category_id?: string;
  is_active: boolean;
  is_featured: boolean;
  images?: string[];
  dimensions?: any;
  available_sizes?: (string | number)[];
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
  categories: Category[];
  product: Product | null;
}

export function EditProductDialog({ 
  open, 
  onOpenChange, 
  onProductUpdated,
  categories,
  product
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    short_description: "",
    sku: "",
    price: "",
    sale_price: "",
    stock_quantity: "",
    weight: "",
    category_id: "",
    is_active: true,
    is_featured: false,
    dimensions: { length: "", width: "", height: "" },
    available_sizes: [] as (string | number)[],
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        short_description: product.short_description || "",
        sku: product.sku || "",
        price: product.price?.toString() || "",
        sale_price: product.sale_price?.toString() || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        weight: product.weight?.toString() || "",
        category_id: product.category_id || "",
        is_active: product.is_active,
        is_featured: product.is_featured,
        dimensions: product.dimensions || { length: "", width: "", height: "" },
        available_sizes: product.available_sizes || [],
      });

      if (product.images && Array.isArray(product.images)) {
        const mediaItems: MediaItem[] = product.images.map((url, index) => ({
          id: `${index}`,
          type: 'image' as const,
          url: url
        }));
        setMedia(mediaItems);
      }
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);

    try {
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
        category_id: formData.category_id || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        images: media.map(item => item.url),
        dimensions: formData.dimensions.length ? formData.dimensions : null,
        available_sizes: formData.available_sizes,
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto atualizado com sucesso",
      });

      onProductUpdated();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar produto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize as informações do produto
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
                  id="edit-new-size"
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
                    const input = document.getElementById('edit-new-size') as HTMLInputElement;
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
              {loading ? "Atualizando..." : "Atualizar Produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}