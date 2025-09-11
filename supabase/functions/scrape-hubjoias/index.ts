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
    // Use regex patterns to extract product data since we can't use DOMParser in Deno
    const productLinkPattern = /href="([^"]*\/produto\/[^"]*)"[^>]*>.*?<h2[^>]*>([^<]+)<\/h2>.*?(?:R\$\s*([\d,]+(?:\.\d{2})?)|<span[^>]*>\s*R\$\s*([\d,]+(?:\.\d{2})?))/gs;
    
    let match;
    while ((match = productLinkPattern.exec(html)) !== null) {
      const [, url, name, price1, price2] = match;
      const priceText = price1 || price2;
      
      if (!name || !priceText || !url) continue;
      
      const price = parseFloat(priceText.replace(',', '.'));
      if (isNaN(price) || price <= 0) continue;
      
      // Extract images from the product section
      const images: string[] = [];
      const imageStart = html.indexOf(url) - 500; // Look around the product link
      const imageEnd = html.indexOf(url) + 500;
      const productSection = html.slice(Math.max(0, imageStart), imageEnd);
      
      const imagePattern = /src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
      let imageMatch;
      while ((imageMatch = imagePattern.exec(productSection)) !== null) {
        const imageSrc = imageMatch[1];
        if (!imageSrc.includes('placeholder') && !imageSrc.includes('logo')) {
          const absoluteUrl = imageSrc.startsWith('http') 
            ? imageSrc 
            : `https://www.hubjoias.com.br${imageSrc}`;
          images.push(absoluteUrl);
        }
      }
      
      products.push({
        name: name.trim().replace(/^Anel\s+/i, ''), // Remove "Anel" prefix
        price,
        images: [...new Set(images)], // Remove duplicates
        sourceUrl: url.startsWith('http') ? url : `https://www.hubjoias.com.br${url}`
      });
    }
    
    // Alternative pattern for different HTML structures
    if (products.length === 0) {
      const altPattern = /<a[^>]*href="([^"]*\/produto\/[^"]*)"[^>]*>.*?alt="([^"]*)".*?R\$\s*([\d,]+(?:\.\d{2})?)/gs;
      
      while ((match = altPattern.exec(html)) !== null) {
        const [, url, name, priceText] = match;
        
        if (!name || !priceText || !url) continue;
        
        const price = parseFloat(priceText.replace(',', '.'));
        if (isNaN(price) || price <= 0) continue;
        
        products.push({
          name: name.trim().replace(/^Anel\s+/i, ''),
          price,
          images: [],
          sourceUrl: url.startsWith('http') ? url : `https://www.hubjoias.com.br${url}`
        });
      }
    }
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  return products;
}