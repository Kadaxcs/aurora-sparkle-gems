import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const TestImporter = () => {
  const [htmlContent, setHtmlContent] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const testExtraction = () => {
    if (!htmlContent.trim()) {
      toast({
        title: "Erro",
        description: "Cole o HTML para testar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      console.log('Document parsed, looking for products...');
      
      // Look for product list items
      const productItems = doc.querySelectorAll('li.product');
      console.log(`Found ${productItems.length} product items`);
      
      const products: any[] = [];
      
      productItems.forEach((item, index) => {
        console.log(`Processing product ${index + 1}:`);
        
        // Find product link
        const link = item.querySelector('a.woocommerce-LoopProduct-link') || 
                    item.querySelector('a[href*="/produto/"]');
        const href = link?.getAttribute('href');
        console.log('  Link:', href);
        
        // Find product title
        const title = item.querySelector('h2.woocommerce-loop-product__title') ||
                     item.querySelector('h2');
        const name = title?.textContent?.trim();
        console.log('  Name:', name);
        
        // Find price
        const priceElement = item.querySelector('.woocommerce-Price-amount bdi') ||
                           item.querySelector('.price');
        const priceText = priceElement?.textContent?.trim();
        console.log('  Price text:', priceText);
        
        // Find images
        const images = Array.from(item.querySelectorAll('img')).map(img => img.src);
        console.log('  Images:', images.length);
        
        if (name && priceText && href) {
          const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.');
          const price = parseFloat(cleanPrice);
          
          products.push({
            name: name.replace(/^Anel\s+/i, ''),
            price,
            images,
            sourceUrl: href
          });
        }
      });
      
      console.log('Final products:', products);
      setResults(products);
      
      toast({
        title: "Teste concluído",
        description: `${products.length} produtos encontrados`,
      });
      
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro no teste",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teste de Extração de Produtos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="Cole aqui o HTML da página de produtos para testar..."
          rows={8}
        />
        <Button onClick={testExtraction}>Testar Extração</Button>
        
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Produtos encontrados:</h4>
            {results.map((product, index) => (
              <div key={index} className="p-2 border rounded">
                <p><strong>Nome:</strong> {product.name}</p>
                <p><strong>Preço:</strong> R$ {product.price}</p>
                <p><strong>Imagens:</strong> {product.images.length}</p>
                <p><strong>URL:</strong> {product.sourceUrl}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};