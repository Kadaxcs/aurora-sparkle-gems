import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductUpdate {
  id: string;
  name: string;
  cost_price: number;
  sale_price: number;
  weight: number;
  description?: string;
  sourceUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, productId } = await req.json();
    
    if (!imageUrl || !productId) {
      return new Response(
        JSON.stringify({ error: 'Image URL and Product ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Re-scraping product from image URL: ${imageUrl}`);
    
    // Extract the base product URL from the image URL
    let productUrl = extractProductUrlFromImage(imageUrl);
    
    if (!productUrl) {
      throw new Error('Could not extract product URL from image');
    }

    console.log(`Extracted product URL: ${productUrl}`);
    
    // Try multiple URL variations if the first one fails
    const urlVariations = [
      productUrl,
      productUrl.replace('/produto/', '/produtos/'),
      productUrl.replace('https://www.hubjoias.com.br/produto/', 'https://hubjoias.com.br/produto/'),
    ];

    let html = '';
    let finalUrl = '';
    
    for (const url of urlVariations) {
      try {
        console.log(`Trying URL: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          html = await response.text();
          finalUrl = url;
          console.log(`Successfully fetched from: ${url}`);
          break;
        } else {
          console.log(`URL failed with status ${response.status}: ${url}`);
        }
      } catch (error) {
        console.log(`URL failed with error: ${url} - ${error.message}`);
        continue;
      }
    }

    if (!html) {
      throw new Error(`All URL variations failed for product`);
    }
    const productData = extractProductData(html, finalUrl);
    
    if (!productData) {
      throw new Error('Could not extract product data from page');
    }

    console.log('Extracted product data:', productData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: productData,
        productId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating product:', error);
    
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

function extractProductUrlFromImage(imageUrl: string): string | null {
  try {
    console.log(`Processing image URL: ${imageUrl}`);
    
    // Patterns to extract SKU/product code from image URL
    const patterns = [
      // Pattern 1: BR123_HJ or similar codes
      /\/([A-Z]{2,}\d+[A-Z]*)[_-].*\.(?:jpg|jpeg|png|webp)/i,
      // Pattern 2: Simple product codes in filename
      /\/([A-Z]{2,}\d+).*\.(?:jpg|jpeg|png|webp)/i,
      // Pattern 3: Extract from descriptive filenames
      /\/([\w-]+?)(?:-\d+)?\.(?:jpg|jpeg|png|webp)/i
    ];

    for (const pattern of patterns) {
      const match = imageUrl.match(pattern);
      if (match && match[1]) {
        let productCode = match[1].toLowerCase()
          .replace(/_hj.*$/i, '')
          .replace(/-still$/i, '')
          .replace(/[^a-z0-9-]/g, '');
        
        console.log(`Extracted product code: ${productCode}`);
        
        // Try different URL patterns for HubJoias
        const possibleUrls = [
          `https://www.hubjoias.com.br/produto/${productCode}/`,
          `https://www.hubjoias.com.br/produto/${productCode.replace('-', '')}/`,
          `https://www.hubjoias.com.br/produtos/${productCode}/`,
        ];
        
        // Return the first URL to try
        return possibleUrls[0];
      }
    }
    
    // Fallback: try to create URL from descriptive filename
    const filename = imageUrl.split('/').pop()?.split('.')[0];
    if (filename) {
      const cleanName = filename.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      console.log(`Fallback product URL: ${cleanName}`);
      return `https://www.hubjoias.com.br/produto/${cleanName}/`;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting product URL:', error);
    return null;
  }
}

function extractProductData(html: string, sourceUrl: string): ProductUpdate | null {
  try {
    console.log('Extracting product data from HTML...');
    
    // Extract product name
    let name = '';
    const namePatterns = [
      /<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<title>([^<]+?)\s*[-|–]\s*HubJoias/i,
      /<h1[^>]*>([^<]+)<\/h1>/i
    ];
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        name = match[1].trim()
          .replace(/^Anel\s+/i, '')
          .replace(/^Brinco\s+/i, '')
          .replace(/^Colar\s+/i, '')
          .replace(/^Pulseira\s+/i, '')
          .replace(/\s*-\s*HubJoias.*$/i, '')
          .replace(/&[^;]+;/g, '')
          .trim();
        console.log(`Found product name: ${name}`);
        break;
      }
    }
    
    if (!name) {
      console.log('Could not extract product name');
      return null;
    }

    // Extract price (cost price from HubJoias) - improved patterns
    let costPrice = 0;
    const pricePatterns = [
      // WooCommerce price patterns
      /<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>[^R]*R\$[^>]*>&nbsp;([0-9,]+(?:\.[0-9]{2})?)<\/bdi>/i,
      /<span[^>]*class="[^"]*amount[^"]*"[^>]*>R\$[^>]*>&nbsp;([0-9,]+(?:\.[0-9]{2})?)<\/span>/i,
      // More flexible price patterns
      /R\$[^>]*>&nbsp;([0-9,]+(?:\.[0-9]{2})?)/i,
      /R\$\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      // Meta price patterns
      /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
      // JSON-LD structured data
      /"price"\s*:\s*"([0-9,]+(?:\.[0-9]{2})?)"/i,
      // Alternative currency patterns
      /currency[^>]*>.*?([0-9,]+(?:\.[0-9]{2})?)/i,
    ];
    
    console.log('Searching for price in HTML...');
    
    for (let i = 0; i < pricePatterns.length; i++) {
      const pattern = pricePatterns[i];
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleanPrice = match[1].replace(/[^\d,]/g, '').replace(',', '.');
        const price = parseFloat(cleanPrice);
        if (!isNaN(price) && price > 0) {
          costPrice = price;
          console.log(`Found cost price with pattern ${i + 1}: R$ ${costPrice}`);
          break;
        }
      }
    }

    if (costPrice === 0) {
      console.log('Could not extract cost price, trying fallback methods...');
      
      // Try to find any price mentioned in the page with broader search
      const fallbackPricePatterns = [
        /(\d+,\d{2})/g,
        /(\d+\.\d{2})/g,
        /R\$\s*(\d+)/g,
      ];
      
      for (const pattern of fallbackPricePatterns) {
        const priceMatches = html.match(pattern);
        if (priceMatches && priceMatches.length > 0) {
          // Use the first reasonable price found
          for (const priceMatch of priceMatches) {
            let price = parseFloat(priceMatch.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (price > 10 && price < 1000) { // Reasonable price range
              costPrice = price;
              console.log(`Using fallback price: R$ ${costPrice}`);
              break;
            }
          }
          if (costPrice > 0) break;
        }
      }
    }

    if (costPrice === 0) {
      console.log('Still no price found, checking for any numerical values...');
      // Last resort: look for any reasonable numerical value
      const allNumbers = html.match(/\d+[,.]?\d*/g);
      if (allNumbers) {
        for (const num of allNumbers) {
          const price = parseFloat(num.replace(',', '.'));
          if (price >= 15 && price <= 500) { // Very reasonable price range for jewelry
            costPrice = price;
            console.log(`Using detected numerical value as price: R$ ${costPrice}`);
            break;
          }
        }
      }
    }

    if (costPrice === 0) {
      console.log('No price found, using default cost price');
      costPrice = 39.00; // Default cost price from your system
    }

    // Calculate sale price with 100% margin
    const salePrice = costPrice * 2;

    // Extract weight/grammage
    let weight = 0;
    const weightPatterns = [
      /peso[^:]*:\s*([0-9,]+)\s*g/i,
      /gramatura[^:]*:\s*([0-9,]+)\s*g/i,
      /([0-9,]+)\s*gramas?/i,
      /weight[^:]*:\s*([0-9,]+)/i
    ];
    
    for (const pattern of weightPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleanWeight = match[1].replace(',', '.');
        const extractedWeight = parseFloat(cleanWeight);
        if (!isNaN(extractedWeight) && extractedWeight > 0) {
          weight = extractedWeight;
          break;
        }
      }
    }

    // If no weight found, estimate based on product type
    if (weight === 0) {
      if (name.toLowerCase().includes('brinco')) {
        weight = 2.5; // Average earring weight
      } else if (name.toLowerCase().includes('anel')) {
        weight = 3.0; // Average ring weight
      } else if (name.toLowerCase().includes('colar')) {
        weight = 8.0; // Average necklace weight
      } else if (name.toLowerCase().includes('pulseira')) {
        weight = 5.0; // Average bracelet weight
      } else {
        weight = 3.0; // Default weight
      }
    }

    // Extract enhanced description
    let description = '';
    const descPatterns = [
      /<div[^>]*class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*elementor-text-editor[^"]*"[^>]*>([\s\S]*?)<\/div>/i
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

    // Generate enhanced description if none found
    if (!description || description.length < 20) {
      const productType = getProductType(name);
      const features = getProductFeatures(name);
      description = generateProductDescription(name, productType, features);
    }

    console.log(`Successfully extracted: ${name}, Cost: R$ ${costPrice}, Sale: R$ ${salePrice}, Weight: ${weight}g`);

    return {
      id: '', // Will be set by caller
      name,
      cost_price: costPrice,
      sale_price: salePrice,
      weight,
      description,
      sourceUrl
    };

  } catch (error) {
    console.error('Error extracting product data:', error);
    return null;
  }
}

function getProductType(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('anel')) return 'anel';
  if (lowerName.includes('brinco')) return 'brinco';
  if (lowerName.includes('colar')) return 'colar';
  if (lowerName.includes('pulseira')) return 'pulseira';
  if (lowerName.includes('piercing')) return 'piercing';
  return 'joia';
}

function getProductFeatures(name: string): string[] {
  const features = [];
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('dourado') || lowerName.includes('ouro')) {
    features.push('acabamento dourado premium');
  }
  if (lowerName.includes('prateado') || lowerName.includes('prata')) {
    features.push('acabamento prateado elegante');
  }
  if (lowerName.includes('zircônia') || lowerName.includes('zirconia')) {
    features.push('cravejado com zircônias de alta qualidade');
  }
  if (lowerName.includes('solitário') || lowerName.includes('solitario')) {
    features.push('design solitário sofisticado');
  }
  if (lowerName.includes('coração') || lowerName.includes('coracao')) {
    features.push('formato de coração romântico');
  }
  if (lowerName.includes('delicado')) {
    features.push('design delicado e feminino');
  }
  
  return features;
}

function generateProductDescription(name: string, productType: string, features: string[]): string {
  const featuresText = features.length > 0 ? ` com ${features.join(', ')}` : '';
  
  return `${name} - Elegante ${productType}${featuresText}. ` +
         `Peça de alta qualidade com design contemporâneo e sofisticado. ` +
         `Ideal para uso diário ou ocasiões especiais. ` +
         `Acabamento resistente e confortável, garantindo durabilidade e estilo. ` +
         `Produto importado com certificado de qualidade.`;
}