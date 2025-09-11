import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Product {
  name: string;
  price: number;
  images: string[];
  description?: string;
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
    const limitedHtml = html.length > 1000000 ? html.substring(0, 1000000) : html;
    
    // Check if this is a single product page
    if (limitedHtml.includes('class="product-title"') || limitedHtml.includes('class="entry-title"') || limitedHtml.includes('/produto/')) {
      const product = extractSingleProduct(limitedHtml);
      if (product) {
        products.push(product);
        return products;
      }
    }
    
    // Original category page extraction logic
    const patterns = [
      /<li[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([^<]+)<\/h2>[\s\S]*?<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>[^R]*R\$[^>]*>([^<]+)<\/bdi>/g,
      /<div[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*\/produto\/[^"]*)"[^>]*>[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>[\s\S]*?R\$[^>]*>([^<]+)/g,
      /<article[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?href="([^"]*)"[\s\S]*?title="([^"]*)"[\s\S]*?R\$[^>]*>([^<]+)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      let matchCount = 0;
      const maxMatches = 50;
      
      while ((match = pattern.exec(limitedHtml)) !== null && matchCount < maxMatches) {
        matchCount++;
        const [, url, name, priceText] = match;
        
        if (!name || !priceText || !url) continue;
        
        const cleanUrl = url.trim();
        if (!cleanUrl.includes('/produto/')) continue;
        
        const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.');
        const price = parseFloat(cleanPrice);
        if (isNaN(price) || price <= 0) continue;
        
        const cleanName = name.trim()
          .replace(/^Anel\s+/i, '')
          .replace(/&[^;]+;/g, '')
          .replace(/\s+/g, ' ');
        
        if (cleanName.length < 3) continue;
        
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
        
        if (products.length >= 30) break;
      }
      
      if (products.length > 0) break;
    }
    
    console.log(`Found ${products.length} products`);
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  return products;
}

function extractSingleProduct(html: string): Product | null {
  try {
    console.log('Extracting single product...');
    
    // Extract product name
    let name = '';
    const namePatterns = [
      /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<title>([^<]*?)\s*[-|]\s*HubJoias[^<]*<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i
    ];
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        name = match[1].trim().replace(/^Anel\s+/i, '').replace(/&[^;]+;/g, '').replace(/\s+/g, ' ');
        break;
      }
    }
    
    if (!name || name.length < 3) {
      console.log('No valid product name found');
      return null;
    }
    
    // Extract price
    let price = 0;
    const pricePatterns = [
      /<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>[^R]*R\$[^>]*>([^<]+)<\/bdi>/i,
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>[^R]*R\$\s*([^<]+)<\/span>/i,
      /R\$\s*([0-9.,]+)/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleanPrice = match[1].replace(/[^\d,]/g, '').replace(',', '.');
        price = parseFloat(cleanPrice);
        if (!isNaN(price) && price > 0) break;
      }
    }
    
    if (price <= 0) {
      console.log('No valid price found');
      return null;
    }
    
    // Extract images
    const images: string[] = [];
    const imagePatterns = [
      /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]*(?:jpg|jpeg|png|webp)[^"]*)"[^>]*/gi,
      /<img[^>]*data-src="([^"]*(?:jpg|jpeg|png|webp)[^"]*)"[^>]*/gi,
      /<img[^>]*src="([^"]*(?:jpg|jpeg|png|webp)[^"]*)"[^>]*alt="[^"]*product[^"]*"/gi,
      /<img[^>]*src="([^"]*(?:jpg|jpeg|png|webp)[^"]*)"[^>]*/gi
    ];
    
    for (const pattern of imagePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const imageSrc = match[1];
        if (imageSrc && 
            imageSrc.includes('hubjoias') && 
            !imageSrc.includes('logo') && 
            !imageSrc.includes('placeholder') &&
            !images.includes(imageSrc)) {
          images.push(imageSrc);
        }
      }
      if (images.length >= 5) break; // Limit to 5 images max
    }
    
    // Extract description
    let description = '';
    const descPatterns = [
      /<div[^>]*class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*product-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="tab-description"[^>]*>([\s\S]*?)<\/div>/i,
      /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
    ];
    
    for (const pattern of descPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        description = match[1]
          .replace(/<[^>]*>/g, ' ')
          .replace(/&[^;]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (description.length > 20) break;
      }
    }
    
    // Fallback description
    if (!description || description.length < 20) {
      description = `${name} - Produto importado da HubJoias. Elegante e sofisticado, perfeito para qualquer ocasião.`;
    }
    
    // Extract current URL for sourceUrl
    const urlMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i);
    const sourceUrl = urlMatch ? urlMatch[1] : '';
    
    console.log(`Extracted product: ${name}, Price: ${price}, Images: ${images.length}, Description length: ${description.length}`);
    
    return {
      name,
      price,
      images,
      description,
      sourceUrl
    };
    
  } catch (error) {
    console.error('Error extracting single product:', error);
    return null;
  }
}