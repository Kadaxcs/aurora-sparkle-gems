import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Product {
  name: string;
  price: number;
  images: string[];
  sourceUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Scraping products from: ${url}`);
    
    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const products = extractProductsFromHtml(html);

    console.log(`Extracted ${products.length} products`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: products,
        count: products.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error scraping products:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractProductsFromHtml(html: string): Product[] {
  const products: Product[] = [];
  
  try {
    // Look for product list items with WooCommerce structure
    const productPattern = /<li[^>]*class="[^"]*product[^"]*"[^>]*>.*?<a[^>]*href="([^"]*\/produto\/[^"]*)"[^>]*class="[^"]*woocommerce-LoopProduct-link[^"]*"[^>]*>.*?<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*">([^<]+)<\/h2>.*?<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>.*?R\$[^>]*>([^<]+)<\/bdi>/gs;
    
    let match;
    while ((match = productPattern.exec(html)) !== null) {
      const [, url, name, priceText] = match;
      
      if (!name || !priceText || !url) continue;
      
      // Clean and parse price
      const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.');
      const price = parseFloat(cleanPrice);
      if (isNaN(price) || price <= 0) continue;
      
      // Extract images from the product section
      const images: string[] = [];
      const productStart = html.indexOf(url) - 1000;
      const productEnd = html.indexOf(url) + 1000;
      const productSection = html.slice(Math.max(0, productStart), productEnd);
      
      const imagePattern = /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
      let imageMatch;
      while ((imageMatch = imagePattern.exec(productSection)) !== null) {
        const imageSrc = imageMatch[1];
        if (!imageSrc.includes('placeholder') && !imageSrc.includes('logo') && imageSrc.includes('hubjoias')) {
          images.push(imageSrc);
        }
      }
      
      products.push({
        name: name.trim().replace(/^Anel\s+/i, ''), // Remove "Anel" prefix
        price,
        images: [...new Set(images)], // Remove duplicates
        sourceUrl: url.startsWith('http') ? url : `https://www.hubjoias.com.br${url}`
      });
    }
    
    // If no products found with first pattern, try simpler pattern
    if (products.length === 0) {
      const simplePattern = /<a[^>]*href="([^"]*\/produto\/[^"]*)"[^>]*>.*?alt="([^"]*)".*?R\$[^>]*>([^<]+)<\/bdi>/gs;
      
      while ((match = simplePattern.exec(html)) !== null) {
        const [, url, name, priceText] = match;
        
        if (!name || !priceText || !url) continue;
        
        const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.');
        const price = parseFloat(cleanPrice);
        if (isNaN(price) || price <= 0) continue;
        
        products.push({
          name: name.trim().replace(/^Anel\s+/i, ''),
          price,
          images: [],
          sourceUrl: url.startsWith('http') ? url : `https://www.hubjoias.com.br${url}`
        });
      }
    }
    
    console.log(`Found ${products.length} products with names: ${products.map(p => p.name).join(', ')}`);
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  return products;
}