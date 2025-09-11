import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductImporter } from "@/utils/ProductImporter";
import { Download, Globe, Package, AlertCircle, CheckCircle } from "lucide-react";
import { ImportExample } from "./ImportExample";

interface ImportedProduct {
  name: string;
  price: number;
  images: string[];
  description?: string;
  sourceUrl: string;
  selected?: boolean;
}

interface Category {
  id: string;
  name: string;
}

export const ProductImporterComponent = () => {
  const [url, setUrl] = useState("https://www.hubjoias.com.br/categoria-produto/aneis/");
  const [htmlContent, setHtmlContent] = useState("");
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] }>({
    success: 0,
    errors: []
  });
  const { toast } = useToast();

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const extractProductsFromUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL válida",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(25);

    try {
      // Try direct fetch first, fallback to edge function if CORS issues
      let html: string;
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        html = await response.text();
      } catch (fetchError) {
        console.log('Direct fetch failed, trying edge function:', fetchError);
        
        // Use edge function as fallback
        const { data, error } = await supabase.functions.invoke('scrape-hubjoias', {
          body: { url }
        });
        
        if (error) throw error;
        
        if (data.success && data.data) {
          const productsWithSelection = data.data.map((product: any) => ({
            ...product,
            selected: true
          }));
          setImportedProducts(productsWithSelection);
          setProgress(100);

          toast({
            title: "Sucesso",
            description: `${data.data.length} produtos encontrados`,
          });
          return;
        } else {
          throw new Error(data.error || "Erro ao processar URL");
        }
      }

      setHtmlContent(html);
      setProgress(50);

      // Extract products from HTML
      const result = await ProductImporter.extractProductsFromHtml(html);
      setProgress(75);

      if (result.success && result.data) {
        const productsWithSelection = result.data.map(product => ({
          ...product,
          selected: true
        }));
        setImportedProducts(productsWithSelection);
        setProgress(100);

        toast({
          title: "Sucesso",
          description: `${result.data.length} produtos encontrados`,
        });
      } else {
        throw new Error(result.error || "Erro ao extrair produtos");
      }
    } catch (error) {
      console.error('Error extracting products:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const extractProductsFromHtml = async () => {
    if (!htmlContent.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código HTML",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(50);

    try {
      const result = await ProductImporter.extractProductsFromHtml(htmlContent);
      setProgress(75);

      if (result.success && result.data) {
        const productsWithSelection = result.data.map(product => ({
          ...product,
          selected: true
        }));
        setImportedProducts(productsWithSelection);
        setProgress(100);

        toast({
          title: "Sucesso",
          description: `${result.data.length} produtos encontrados`,
        });
      } else {
        throw new Error(result.error || "Erro ao extrair produtos");
      }
    } catch (error) {
      console.error('Error extracting products:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar HTML",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const toggleProductSelection = (index: number) => {
    setImportedProducts(prev => 
      prev.map((product, i) => 
        i === index ? { ...product, selected: !product.selected } : product
      )
    );
  };

  const toggleAllProducts = () => {
    const allSelected = importedProducts.every(p => p.selected);
    setImportedProducts(prev => 
      prev.map(product => ({ ...product, selected: !allSelected }))
    );
  };

  const importSelectedProducts = async () => {
    const selectedProducts = importedProducts.filter(p => p.selected);
    
    if (selectedProducts.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um produto para importar",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCategory) {
      toast({
        title: "Aviso",
        description: "Selecione uma categoria para os produtos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setImportResults({ success: 0, errors: [] });

    try {
      const totalProducts = selectedProducts.length;
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        setProgress((i / totalProducts) * 100);

        try {
          const productData = {
            name: product.name,
            slug: ProductImporter.generateSlug(product.name),
            price: product.price, // Using imported price as cost price
            sale_price: null, // User will set this manually
            sku: ProductImporter.generateSKU(product.name),
            description: `<p>Produto importado de ${product.sourceUrl}</p><p>Preço de custo: R$ ${product.price.toFixed(2)}</p>`,
            short_description: product.name,
            images: product.images,
            category_id: selectedCategory,
            stock_quantity: 0, // Default stock
            weight: 0, // Default weight
            material: "Todas as Semijoias da BellaAurora possuem 10 milésimos de ouro",
            available_sizes: [12, 14, 16, 18, 20, 22], // Default ring sizes
            is_active: false, // Import as inactive for review
            is_featured: false
          };

          const { error } = await supabase
            .from('products')
            .insert(productData);

          if (error) {
            errors.push(`${product.name}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`${product.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      setProgress(100);
      setImportResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${successCount} produtos importados com sucesso${errors.length > 0 ? ` (${errors.length} erros)` : ''}`,
        });

        // Clear imported products on success
        if (errors.length === 0) {
          setImportedProducts([]);
        }
      } else {
        toast({
          title: "Erro na importação",
          description: "Nenhum produto foi importado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: "Erro",
        description: "Erro durante a importação dos produtos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const selectedCount = importedProducts.filter(p => p.selected).length;

  return (
    <div className="space-y-6">
      <ImportExample />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importador de Produtos HubJoias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL da categoria de produtos</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.hubjoias.com.br/categoria-produto/aneis/"
              />
              <Button 
                onClick={extractProductsFromUrl} 
                disabled={isLoading}
                className="whitespace-nowrap"
              >
                <Globe className="h-4 w-4 mr-2" />
                Extrair da URL
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">Ou cole o código HTML da página</Label>
            <Textarea
              id="html"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Cole aqui o código HTML da página de produtos..."
              rows={6}
            />
            <Button 
              onClick={extractProductsFromHtml} 
              disabled={isLoading}
              variant="outline"
            >
              <Package className="h-4 w-4 mr-2" />
              Extrair do HTML
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Processando produtos...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {importedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Produtos Encontrados ({importedProducts.length})</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={importedProducts.every(p => p.selected)}
                    onCheckedChange={toggleAllProducts}
                  />
                  <Label>Selecionar todos</Label>
                </div>
                <Badge variant="secondary">
                  {selectedCount} selecionados
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria para importação</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

            <div className="max-h-96 overflow-y-auto space-y-2">
              {importedProducts.map((product, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Checkbox 
                    checked={product.selected}
                    onCheckedChange={() => toggleProductSelection(index)}
                  />
                  {product.images.length > 0 && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Preço de custo: R$ {product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.images.length} imagem(ns)
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={importSelectedProducts}
              disabled={isLoading || selectedCount === 0 || !selectedCategory}
              className="w-full"
            >
              <Package className="h-4 w-4 mr-2" />
              Importar {selectedCount} Produtos Selecionados
            </Button>
          </CardContent>
        </Card>
      )}

      {importResults.success > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{importResults.success} produtos importados com sucesso!</strong>
            {importResults.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  Ver {importResults.errors.length} erro(s)
                </summary>
                <ul className="mt-2 text-sm space-y-1">
                  {importResults.errors.map((error, index) => (
                    <li key={index} className="text-destructive">• {error}</li>
                  ))}
                </ul>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Os produtos serão importados como inativos com o preço original como preço de custo. 
          Você precisará definir manualmente os preços de venda e ativar os produtos após revisar as informações.
        </AlertDescription>
      </Alert>
    </div>
  );
};