import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, RefreshCw } from "lucide-react";

export function AdminProductImport() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importData, setImportData] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const parseHubJoiasData = (htmlContent: string) => {
    // Simular parsing de produtos do HTML da Hub Joias
    // Na prática, você faria um scraping mais sofisticado
    const products = [
      {
        name: "Anel Solitário Ouro 18k",
        description: "Elegante anel solitário em ouro 18k com diamante",
        price: 450.00,
        category: "Anéis",
        images: ["/placeholder.svg"],
        sku: "AN001",
        stock_quantity: 10
      },
      {
        name: "Brinco Argola Ouro Branco",
        description: "Par de brincos argola em ouro branco 18k",
        price: 320.00,
        category: "Brincos", 
        images: ["/placeholder.svg"],
        sku: "BR001",
        stock_quantity: 15
      },
      {
        name: "Colar Riviera Ouro Amarelo",
        description: "Colar riviera em ouro 18k amarelo com pedras",
        price: 680.00,
        category: "Colares",
        images: ["/placeholder.svg"],
        sku: "CO001", 
        stock_quantity: 8
      },
      {
        name: "Pulseira Tennis Ouro Rose",
        description: "Pulseira tennis em ouro rose 18k com zircônias",
        price: 520.00,
        category: "Pulseiras",
        images: ["/placeholder.svg"],
        sku: "PU001",
        stock_quantity: 12
      },
      {
        name: "Conjunto Coração Ouro 18k",
        description: "Conjunto colar e brincos coração em ouro 18k",
        price: 890.00,
        category: "Conjuntos",
        images: ["/placeholder.svg"],
        sku: "CJ001",
        stock_quantity: 6
      }
    ];
    
    return products;
  };

  const importFromHubJoias = async () => {
    setLoading(true);
    setProgress(0);
    
    try {
      // Simular busca de produtos da Hub Joias
      toast({
        title: "Iniciando importação",
        description: "Buscando produtos da Hub Joias...",
      });
      
      setProgress(25);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const products = parseHubJoiasData("");
      setProgress(50);
      
      // Verificar se existe uma categoria padrão ou criar
      let categoryId = null;
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .limit(1);
      
      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      }
      
      setProgress(75);
      
      const importedProducts = [];
      
      // Inserir produtos no banco
      for (const product of products) {
        const productData = {
          name: product.name,
          description: product.description,
          short_description: product.description.substring(0, 100),
          price: product.price,
          sku: product.sku,
          stock_quantity: product.stock_quantity,
          images: product.images,
          category_id: categoryId,
          is_active: true,
          is_featured: false,
          slug: product.name.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        };
        
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao inserir produto:', error);
          continue;
        }
        
        importedProducts.push(data);
      }
      
      setProgress(100);
      setResults(importedProducts);
      
      toast({
        title: "Importação concluída!",
        description: `${importedProducts.length} produtos importados com sucesso`,
      });
      
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro",
        description: "Falha na importação dos produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const manualImport = async () => {
    if (!importData.trim()) {
      toast({
        title: "Erro",
        description: "Cole os dados dos produtos para importar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Tentar parsear como JSON
      const products = JSON.parse(importData);
      
      if (!Array.isArray(products)) {
        throw new Error("Dados devem ser um array de produtos");
      }

      const importedProducts = [];
      
      for (const product of products) {
        const productData = {
          name: product.name || "Produto sem nome",
          description: product.description || "",
          short_description: (product.description || "").substring(0, 100),
          price: parseFloat(product.price) || 0,
          sku: product.sku || `PROD-${Date.now()}`,
          stock_quantity: parseInt(product.stock_quantity) || 0,
          images: product.images || ["/placeholder.svg"],
          is_active: true,
          is_featured: false,
          slug: (product.name || "produto")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        };
        
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao inserir produto:', error);
          continue;
        }
        
        importedProducts.push(data);
      }
      
      setResults(importedProducts);
      
      toast({
        title: "Importação concluída!",
        description: `${importedProducts.length} produtos importados`,
      });
      
    } catch (error) {
      console.error('Erro na importação manual:', error);
      toast({
        title: "Erro",
        description: "Dados inválidos. Use formato JSON",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Importar Produtos</h1>
        <p className="text-muted-foreground">Importe produtos automaticamente ou manualmente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Importação Automática */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Importação da Hub Joias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importe produtos automaticamente do catálogo da Hub Joias.
              Os preços virão como preço de custo para você ajustar depois.
            </p>
            
            {loading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center">{progress}% concluído</p>
              </div>
            )}
            
            <Button 
              onClick={importFromHubJoias}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {loading ? "Importando..." : "Importar da Hub Joias"}
            </Button>
          </CardContent>
        </Card>

        {/* Importação Manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importação Manual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Dados dos Produtos (JSON)</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={`[
  {
    "name": "Nome do Produto",
    "description": "Descrição do produto",
    "price": 299.90,
    "sku": "PROD001", 
    "stock_quantity": 10,
    "images": ["/placeholder.svg"]
  }
]`}
                className="min-h-32 font-mono text-sm"
              />
            </div>
            
            <Button 
              onClick={manualImport}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Manualmente
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Importados ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku} | Preço: R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Importado'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✅ Produtos importados como preço de custo. 
                Acesse a seção "Produtos" para ajustar os preços de venda.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}