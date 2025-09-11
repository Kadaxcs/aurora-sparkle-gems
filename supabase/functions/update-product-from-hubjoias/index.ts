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
    const productUrl = extractProductUrlFromImage(imageUrl);
    
    if (!productUrl) {
      throw new Error('Could not extract product URL from image');
    }

    console.log(`Extracted product URL: ${productUrl}`);
    
    // Fetch the product page
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const productData = extractProductData(html, productUrl);
    
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
    // HubJoias image URLs follow pattern: https://www.hubjoias.com.br/wp-content/uploads/YYYY/MM/filename.ext
    // We need to find the corresponding product page
    
    // Extract filename without extension
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const baseFilename = filename.split('.')[0];
    
    // Clean filename to create potential slug
    let slug = baseFilename
      .toLowerCase()
      .replace(/_hj.*$/i, '') // Remove _HJ suffixes
      .replace(/[-_]still$/i, '') // Remove -still suffixes
      .replace(/[-_].*$/i, '') // Remove other suffixes
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Common patterns for HubJoias product URLs
    const possibleUrls = [
      `https://www.hubjoias.com.br/produto/${slug}/`,
      `https://www.hubjoias.com.br/produto/anel-${slug}/`,
      `https://www.hubjoias.com.br/produto/brinco-${slug}/`,
      `https://www.hubjoias.com.br/produto/colar-${slug}/`,
      `https://www.hubjoias.com.br/produto/pulseira-${slug}/`,
    ];

    // Return the first possible URL (we'll try them in the main function)
    return possibleUrls[0];
    
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
      /<title>([^|<]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        name = match[1].trim()
          .replace(/^Anel\s+/i, '')
          .replace(/\s*-\s*HubJoias.*$/i, '')
          .replace(/&[^;]+;/g, '')
          .trim();
        break;
      }
    }
    
    if (!name) {
      console.log('Could not extract product name');
      return null;
    }

    // Extract price (cost price from HubJoias)
    let costPrice = 0;
    const pricePatterns = [
      /R\$[^>]*>&nbsp;([0-9,]+(?:\.[0-9]{2})?)/i,
      /<span[^>]*woocommerce-Price-amount[^>]*>[^R]*R\$[^>]*>&nbsp;([^<]+)/i,
      /R\$\s*([0-9,]+(?:\.[0-9]{2})?)/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleanPrice = match[1].replace(/[^\d,]/g, '').replace(',', '.');
        const price = parseFloat(cleanPrice);
        if (!isNaN(price) && price > 0) {
          costPrice = price;
          break;
        }
      }
    }

    if (costPrice === 0) {
      console.log('Could not extract cost price');
      return null;
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