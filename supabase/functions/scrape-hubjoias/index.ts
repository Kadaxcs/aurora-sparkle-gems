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
    // Limit HTML size to prevent timeout
    const maxHtmlSize = 500000; // 500KB limit
    const limitedHtml = html.length > maxHtmlSize ? html.substring(0, maxHtmlSize) : html;
    
    // Updated patterns for HubJoias product structure
    const patterns = [
      // Pattern 1: WooCommerce product with title and price
      /<li[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([^<]+)<\/h2>[\s\S]*?<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>[^R]*R\$[^>]*>([^<]+)<\/bdi>/g,
      
      // Pattern 2: Simple product link with title and price
      /<div[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*\/produto\/[^"]*)"[^>]*>[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>[\s\S]*?R\$[^>]*>([^<]+)/g,
      
      // Pattern 3: Alternative structure
      /<article[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?href="([^"]*)"[\s\S]*?title="([^"]*)"[\s\S]*?R\$[^>]*>([^<]+)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      let matchCount = 0;
      const maxMatches = 50; // Limit matches to prevent timeout
      
      while ((match = pattern.exec(limitedHtml)) !== null && matchCount < maxMatches) {
        matchCount++;
        const [, url, name, priceText] = match;
        
        if (!name || !priceText || !url) continue;
        
        // Clean and validate URL
        const cleanUrl = url.trim();
        if (!cleanUrl.includes('/produto/')) continue;
        
        // Clean and parse price
        const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.');
        const price = parseFloat(cleanPrice);
        if (isNaN(price) || price <= 0) continue;
        
        // Clean product name
        const cleanName = name.trim()
          .replace(/^Anel\s+/i, '')
          .replace(/&[^;]+;/g, '') // Remove HTML entities
          .replace(/\s+/g, ' '); // Normalize spaces
        
        if (cleanName.length < 3) continue; // Skip very short names
        
        // Extract one image quickly (don't search for all images to save time)
        const images: string[] = [];
        const imageMatch = limitedHtml.match(new RegExp(`<img[^>]*src="([^"]*(?:jpg|jpeg|png|webp)[^"]*)"[^>]*(?:alt="${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}")?`, 'i'));
        if (imageMatch && imageMatch[1] && imageMatch[1].includes('hubjoias')) {
          images.push(imageMatch[1]);
        }
        
        products.push({
          name: cleanName,
          price,
          images,
          sourceUrl: cleanUrl.startsWith('http') ? cleanUrl : `https://www.hubjoias.com.br${cleanUrl}`
        });
        
        // Break if we found enough products
        if (products.length >= 30) break;
      }
      
      // If we found products with this pattern, stop trying other patterns
      if (products.length > 0) break;
    }
    
    console.log(`Found ${products.length} products`);
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  return products;
}