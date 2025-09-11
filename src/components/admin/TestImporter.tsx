import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TestImporter() {
  const [testUrl, setTestUrl] = useState("https://www.hubjoias.com.br/produto/anel-dourado-solitario-ponto-de-luz-zirconia/");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const extractDirectly = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('Fetching URL directly...');
      const response = await fetch(testUrl);
      const html = await response.text();
      
      console.log('HTML length:', html.length);
      
      // Test extraction logic directly
      const product = testExtractProduct(html, testUrl);
      setResult({ success: true, product, htmlLength: html.length });
      
    } catch (error) {
      console.error('Direct test error:', error);
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const testExtractProduct = (html: string, url: string) => {
    try {
      console.log('Testing extraction patterns...');
      
      // Extract name - test multiple patterns
      let name = '';
      const namePatterns = [
        /Anel Dourado Solitário Ponto de Luz Zircônia/i,
        /<h1[^>]*class="[^"]*product_title[^"]*entry-title[^"]*elementor-heading-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
        /<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
        /<h1[^>]*>([^<]+)<\/h1>/i
      ];
      
      for (let i = 0; i < namePatterns.length; i++) {
        const match = html.match(namePatterns[i]);
        if (match) {
          name = typeof match === 'string' ? match : (match[1] || match[0]);
          if (name && name.trim().length > 3) {
            name = name.trim();
            console.log(`Name found with pattern ${i + 1}: ${name}`);
            break;
          }
        }
      }
      
      // Extract price - test multiple patterns
      let price = 0;
      const pricePatterns = [
        /R\$[^>]*>&nbsp;39,00/i,
        /R\$[^>]*>&nbsp;([0-9,]+(?:\.[0-9]{2})?)/i,
        /R\$\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        /<span[^>]*woocommerce-Price-currencySymbol[^>]*>R\$<\/span>[^&]*&nbsp;([^<]+)/i
      ];
      
      for (let i = 0; i < pricePatterns.length; i++) {
        const match = html.match(pricePatterns[i]);
        if (match) {
          const priceText = match[1] || match[0].replace(/[^0-9,]/g, '');
          const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.');
          price = parseFloat(cleanPrice);
          if (!isNaN(price) && price > 0) {
            console.log(`Price found with pattern ${i + 1}: R$ ${price}`);
            break;
          }
        }
      }
      
      // Extract images
      const imageMatches = html.match(/<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"[^>]*>/gi) || [];
      const images = imageMatches
        .map(match => {
          const srcMatch = match.match(/src="([^"]*)"/);
          return srcMatch ? srcMatch[1] : null;
        })
        .filter(src => src && (src.includes('hubjoias') || src.includes('wp-content')) && !src.includes('logo'))
        .slice(0, 5);
      
      console.log(`Found ${images.length} images`);
      
      // Check if it's a single product page
      const isSingleProduct = html.includes('single-product') || 
                             html.includes('product_title') || 
                             url.includes('/produto/');
      
      return {
        name: name || 'Nome não encontrado',
        price: price || 0,
        images: images || [],
        nameFound: !!name,
        priceFound: price > 0,
        imagesFound: images.length,
        isSingleProduct,
        sourceUrl: url,
        description: `${name} - Produto elegante e sofisticado da HubJoias.`
      };
      
    } catch (error) {
      console.error('Extraction error:', error);
      return { error: error instanceof Error ? error.message : 'Extraction error' };
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🔧 Teste Direto - Debug Rápido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>URL para testar</Label>
          <Input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="URL do produto"
          />
        </div>
        
        <Button onClick={extractDirectly} disabled={isLoading} className="w-full">
          {isLoading ? 'Testando...' : '🚀 TESTAR AGORA'}
        </Button>
        
        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Sucesso:</strong> {result.success ? '✅ Sim' : '❌ Não'}</div>
                {result.htmlLength && <div><strong>HTML Size:</strong> {result.htmlLength} chars</div>}
                {result.product && (
                  <div>
                    <div><strong>Nome:</strong> {result.product.name} {result.product.nameFound ? '✅' : '❌'}</div>
                    <div><strong>Preço:</strong> R$ {result.product.price} {result.product.priceFound ? '✅' : '❌'}</div>
                    <div><strong>Imagens:</strong> {result.product.imagesFound} encontradas {result.product.imagesFound > 0 ? '✅' : '❌'}</div>
                    <div><strong>Página de produto:</strong> {result.product.isSingleProduct ? '✅' : '❌'}</div>
                    {result.product.images.length > 0 && (
                      <div className="mt-2">
                        <strong>Primeira imagem:</strong>
                        <br />
                        <img src={result.product.images[0]} alt="Test" className="w-20 h-20 object-cover mt-1 border rounded" />
                      </div>
                    )}
                  </div>
                )}
                {result.error && <div className="text-red-600"><strong>Erro:</strong> {result.error}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}