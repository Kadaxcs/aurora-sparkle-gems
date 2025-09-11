import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Eye, Check, X, Download, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  price: number;
  weight: number;
  stock_quantity: number;
  is_active: boolean;
  images: any;
  description?: string;
  sku?: string;
}

interface ProductUpdateData {
  id: string;
  name: string;
  cost_price: number;
  sale_price: number;
  weight: number;
  description?: string;
  sourceUrl: string;
}

interface ProductWithUpdate extends Product {
  updateData?: ProductUpdateData;
  selected: boolean;
  isUpdating: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export function ProductUpdatePanel() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "updated" | "error">("all");

  useEffect(() => {
    fetchInactiveProducts();
  }, []);

  const fetchInactiveProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, weight, stock_quantity, is_active, images, description, sku')
        .eq('is_active', false)
        .eq('price', 39)
        .order('name');

      if (error) throw error;

      const productsWithSelection = data.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [],
        selected: false,
        isUpdating: false,
        hasError: false
      }));

      setProducts(productsWithSelection);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSingleProduct = async (product: ProductWithUpdate): Promise<boolean> => {
    try {
      if (!product.images || product.images.length === 0) {
        throw new Error('Produto sem imagem de referência');
      }

      const imageUrl = product.images[0];
      console.log(`Updating product ${product.name} with image: ${imageUrl}`);
      
      // Call our edge function to scrape product data
        const { data, error } = await supabase.functions.invoke('update-product-from-hubjoias', {
          body: { imageUrl, productId: product.id, sku: product.sku, productName: product.name }
        });

      if (error) {
        console.error(`Supabase function error for ${product.id}:`, error);
        throw new Error(`Erro na função: ${error.message || 'Erro desconhecido'}`);
      }
      
      if (!data.success) {
        console.error(`Function returned error for ${product.id}:`, data.error);
        throw new Error(data.error || 'Erro ao processar produto');
      }

      const updateData = data.data as ProductUpdateData;
      console.log(`Successfully updated ${product.name}:`, updateData);
      
      // Update the product in our state first
      setProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, updateData, isUpdating: false, hasError: false, errorMessage: undefined }
          : p
      ));

      return true;
    } catch (error) {
      console.error(`Error updating product ${product.id}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { 
              ...p, 
              isUpdating: false, 
              hasError: true, 
              errorMessage
            }
          : p
      ));
      
      return false;
    }
  };

  const updateSelectedProducts = async () => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um produto para atualizar",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    setProgress(0);

    // Mark selected products as updating
    setProducts(prev => prev.map(p => 
      p.selected ? { ...p, isUpdating: true, hasError: false } : p
    ));

    let successCount = 0;
    const total = selectedProducts.length;

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      const success = await updateSingleProduct(product);
      
      if (success) successCount++;
      
      setProgress(((i + 1) / total) * 100);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setUpdating(false);
    setProgress(0);

    toast({
      title: "Atualização Concluída",
      description: `${successCount} de ${total} produtos atualizados com sucesso`,
      variant: successCount === total ? "default" : "destructive",
    });
  };

  const applyUpdates = async () => {
    const productsToUpdate = products.filter(p => p.updateData && p.selected);
    
    if (productsToUpdate.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum produto com dados atualizados selecionado",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      
      for (const product of productsToUpdate) {
        const { updateData } = product;
        if (!updateData) continue;

        const { error } = await supabase
          .from('products')
          .update({
            name: updateData.name,
            price: updateData.sale_price,
            weight: updateData.weight,
            description: updateData.description,
            is_active: true,
            stock_quantity: 10 // Default stock
          })
          .eq('id', product.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `${productsToUpdate.length} produtos ativados com sucesso`,
      });

      // Refresh the list
      fetchInactiveProducts();
      
    } catch (error) {
      console.error('Error applying updates:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar atualizações",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    const filteredProducts = getFilteredProducts();
    const allSelected = filteredProducts.every(p => p.selected);
    
    setProducts(prev => prev.map(p => {
      if (filteredProducts.some(fp => fp.id === p.id)) {
        return { ...p, selected: !allSelected };
      }
      return p;
    }));
  };

  const toggleSelectProduct = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, selected: !p.selected } : p
    ));
  };

  const getFilteredProducts = () => {
    switch (filter) {
      case "pending":
        return products.filter(p => !p.updateData && !p.hasError);
      case "updated":
        return products.filter(p => p.updateData);
      case "error":
        return products.filter(p => p.hasError);
      default:
        return products;
    }
  };

  const filteredProducts = getFilteredProducts();
  const selectedCount = products.filter(p => p.selected).length;
  const updatedCount = products.filter(p => p.updateData).length;
  const errorCount = products.filter(p => p.hasError).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Atualização Inteligente de Produtos
          </CardTitle>
          <CardDescription>
            Re-processe produtos inativos com dados atualizados do HubJoias. 
            Margem de 100% será aplicada automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-2">
              <Badge variant="outline">
                {products.length} produtos inativos
              </Badge>
              <Badge variant="secondary">
                {selectedCount} selecionados
              </Badge>
              <Badge variant="default">
                {updatedCount} atualizados
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} com erro
                </Badge>
              )}
            </div>
            
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="updated">Atualizados</SelectItem>
                <SelectItem value="error">Com Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {updating && (
            <div className="mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                Atualizando produtos... {Math.round(progress)}%
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Button
              onClick={updateSelectedProducts}
              disabled={updating || selectedCount === 0}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Buscar Dados ({selectedCount})
            </Button>
            
            <Button
              onClick={applyUpdates}
              disabled={updating || updatedCount === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Ativar Produtos ({products.filter(p => p.updateData && p.selected).length})
            </Button>

            <Button
              onClick={() => {
                // Test with first product
                const firstProduct = products.find(p => !p.updateData && !p.hasError);
                if (firstProduct) {
                  updateSingleProduct(firstProduct);
                }
              }}
              disabled={updating}
              variant="secondary"
              size="sm"
            >
              Teste 1 Produto
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredProducts.length > 0 && filteredProducts.every(p => p.selected)}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Preço Atual</TableHead>
                <TableHead>Novo Preço</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={product.selected}
                      onCheckedChange={() => toggleSelectProduct(product.id)}
                      disabled={product.isUpdating}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.updateData && product.updateData.name !== product.name && (
                        <p className="text-sm text-green-600">→ {product.updateData.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.updateData ? (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          Custo: R$ {product.updateData.cost_price.toFixed(2)}
                        </div>
                        <div className="font-medium text-green-600">
                          Venda: R$ {product.updateData.sale_price.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.updateData ? (
                      <span className="text-green-600">
                        {product.updateData.weight.toFixed(1)}g
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {product.weight.toFixed(1)}g
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.isUpdating && (
                      <Badge variant="secondary">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Processando
                      </Badge>
                    )}
                    {product.hasError && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Erro
                      </Badge>
                    )}
                    {product.updateData && !product.isUpdating && (
                      <Badge variant="default">
                        <Check className="h-3 w-3 mr-1" />
                        Atualizado
                      </Badge>
                    )}
                    {!product.updateData && !product.isUpdating && !product.hasError && (
                      <Badge variant="outline">
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.hasError && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSingleProduct(product)}
                          disabled={product.isUpdating}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        {product.errorMessage && (
                          <div className="text-xs text-red-600 max-w-40 truncate" title={product.errorMessage}>
                            {product.errorMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}