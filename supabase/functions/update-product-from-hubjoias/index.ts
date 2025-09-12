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

  // Safeguard variables for logging in catch
  let productId: string | undefined;
  let sku: string | undefined;
  let productName: string | undefined;
  let imageUrl: string | undefined;

  try {
    let body: any = {};
    try { body = await req.json(); } catch (_e) { body = {}; }
    imageUrl = body.imageUrl;
    productId = body.productId;
    sku = body.sku;
    productName = body.productName;

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing product ${productId} with SKU: ${sku}, Name: ${productName}`);
    
    // Build product URL from SKU or product name
    let productUrl = buildProductUrl(sku, productName, imageUrl);
    
    if (!productUrl) {
      throw new Error('Could not build product URL from SKU, name, or image');
    }

    console.log(`Built product URL: ${productUrl}`);
    
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
          },
          signal: AbortSignal.timeout(12000)
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
      console.log('Direct URL fetch failed, trying search fallback...');
      const searchQueries = [sku, productName].filter(Boolean) as string[];
      for (const q of searchQueries) {
        try {
          const searchUrl = `https://www.hubjoias.com.br/?s=${encodeURIComponent(q!)}`;
          console.log(`Searching HubJoias with: ${searchUrl}`);
          const searchRes = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache'
            },
            signal: AbortSignal.timeout(12000)
          });
          if (searchRes.ok) {
            const searchHtml = await searchRes.text();
            const bestLink = await pickBestSearchResult(searchHtml, productName, sku, imageUrl);
            if (bestLink) {
              console.log(`Search best match: ${bestLink}`);
              const prodRes = await fetch(bestLink, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                  'Cache-Control': 'no-cache'
                },
                signal: AbortSignal.timeout(12000)
              });
              if (prodRes.ok) {
                html = await prodRes.text();
                finalUrl = bestLink;
                console.log('Fetched product page via search best-match');
                break;
              }
            }
          }
        } catch (e) {
          console.log('Search attempt failed:', (e as Error).message);
        }
      }
    }

    if (!html) {
      throw new Error(`All URL resolution methods failed for product ${sku || productName}`);
    }
    const productData = extractProductData(html, finalUrl, sku, productName);
    
    if (!productData) {
      throw new Error('Could not extract product data from page');
    }

    console.log(`Extracted data for ${sku || productName}:`, productData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: productData,
        productId,
        sku: sku || 'N/A',
        sourceUrl: finalUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error updating product ${sku || productName || 'unknown'}:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Erro desconhecido',
        productId,
        sku: sku || 'N/A'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function buildProductUrl(sku?: string, productName?: string, imageUrl?: string): string | null {
  try {
    // Priority 1: Use SKU if available
    if (sku && sku.trim()) {
      const cleanSku = sku.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      console.log(`Building URL from SKU: ${sku} -> ${cleanSku}`);
      return `https://www.hubjoias.com.br/produto/${cleanSku}/`;
    }
    
    // Priority 2: Use product name
    if (productName && productName.trim()) {
      const cleanName = productName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      console.log(`Building URL from product name: ${productName} -> ${cleanName}`);
      return `https://www.hubjoias.com.br/produto/${cleanName}/`;
    }
    
    // Priority 3: Fallback to image URL (legacy method)
    if (imageUrl) {
      console.log(`Falling back to image URL method: ${imageUrl}`);
      return extractProductUrlFromImage(imageUrl);
    }
    
    return null;
  } catch (error) {
    console.error('Error building product URL:', error);
    return null;
  }
}

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

function extractFirstProductLinkFromSearch(html: string): string | null {
  const cards = extractProductCardsFromSearch(html);
  return cards[0]?.url || null;
}

function extractProductCardsFromSearch(html: string): { url: string; title: string }[] {
  const results: { url: string; title: string }[] = [];
  try {
    const itemRegexes = [
      /<li[^>]*class="[^"]*product[^"]*"[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([^<]+)<\/h2>/gi,
      /<a[^>]*href="([^"]*\/produto\/[^"]+)"[^>]*>[\s\S]*?<h[12-4][^>]*>([^<]+)<\/h[12-4]>/gi,
      /<article[^>]*class="[^"]*product[^"]*"[\s\S]*?href="([^"]+)"[\s\S]*?title="([^"]+)"/gi
    ];
    for (const rx of itemRegexes) {
      let m;
      while ((m = rx.exec(html)) !== null) {
        const url = m[1].startsWith('http') ? m[1] : `https://www.hubjoias.com.br${m[1]}`;
        const title = (m[2] || '').trim();
        if (url.includes('/produto/')) results.push({ url, title });
      }
      if (results.length) break;
    }
  } catch {}
  return results;
}

function normalizeText(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccard(a: string, b: string): number {
  const A = new Set(normalizeText(a).split(' '));
  const B = new Set(normalizeText(b).split(' '));
  const inter = new Set([...A].filter(x => B.has(x))).size;
  const uni = new Set([...A, ...B]).size || 1;
  return inter / uni;
}

function getImageCode(imageUrl?: string): string | null {
  if (!imageUrl) return null;
  const m = imageUrl.match(/\/([A-Z]+\d+_HJ)/i);
  return m ? m[1] : null;
}

async function pickBestSearchResult(html: string, productName?: string, sku?: string, imageUrl?: string): Promise<string | null> {
  const cards = extractProductCardsFromSearch(html);
  if (cards.length === 0) return null;

  const code = getImageCode(imageUrl) || sku || '';

  // Score by name similarity
  let best = cards[0];
  let bestScore = -1;
  for (const c of cards) {
    const score = productName ? jaccard(c.title, productName) : 0;
    if (score > bestScore) {
      best = c; bestScore = score;
    }
  }

  // Try to verify candidates by checking SKU/image code inside product page
  const candidates = [best, ...cards.filter(c => c !== best)].slice(0, 5);
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const page = await res.text();
      if (code && page.toLowerCase().includes(code.toLowerCase())) {
        return c.url;
      }
      // If no code to verify but title is very similar, accept
      if (bestScore >= 0.35) return c.url;
    } catch {}
  }
  return best.url;
}

function extractPriceFromJsonLd(html: string): number | null {
  try {
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      const jsonText = match[1].trim();
      try {
        const data = JSON.parse(jsonText);
        const nodes = Array.isArray(data) ? data : [data];
        for (const node of nodes) {
          // WooCommerce often nests Product -> offers -> price
          if (node['@type'] === 'Product') {
            const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
            const priceStr = offers?.price ?? offers?.lowPrice ?? node.price ?? node.lowPrice;
            if (priceStr) {
              const p = parseFloat(String(priceStr).replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.'));
              if (!isNaN(p) && p > 0 && p < 10000) return p;
            }
          }
          // Sometimes the script contains an array with different structures
          if (node['@graph']) {
            for (const g of node['@graph']) {
              if (g['@type'] === 'Product') {
                const offers = Array.isArray(g.offers) ? g.offers[0] : g.offers;
                const priceStr = offers?.price ?? offers?.lowPrice ?? g.price ?? g.lowPrice;
                if (priceStr) {
                  const p = parseFloat(String(priceStr).replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.'));
                  if (!isNaN(p) && p > 0 && p < 10000) return p;
                }
              }
            }
          }
        }
      } catch (_) {
        continue;
      }
    }
  } catch (_) {}
  return null;
}

function extractPriceFromMetaTags(html: string): number | null {
  try {
    const patterns = [
      /<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /itemprop=["']price["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /data-price=["']([^"']+)["']/i
    ];
    for (const rx of patterns) {
      const m = html.match(rx);
      if (m && m[1]) {
        const p = parseFloat(m[1].replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.'));
        if (!isNaN(p) && p > 0 && p < 1000) return p;
      }
    }
  } catch (_) {}
  return null;
}

function getMainProductPriceHtml(html: string): string | null {
  try {
    const markers = [
      /summary\s+entry-summary/i,
      /id=\"product-\d+\"/i,
      /class=\"product\s+type-product[^\"]*\"/i,
      /class=\"price[^\"]*\"/i,
      /woocommerce-Price-amount/i
    ];
    for (const m of markers) {
      const idx = html.search(m);
      if (idx !== -1) {
        return html.slice(idx, Math.min(idx + 15000, idx + Math.floor(html.length * 0.5)));
      }
    }
    return null;
  } catch {
    return null;
  }
}

function extractProductData(html: string, sourceUrl: string, sku?: string, productName?: string): ProductUpdate | null {
  try {
    console.log(`Extracting product data for SKU: ${sku}, Name: ${productName}`);
    
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
    
    // Use the provided product name as fallback if extraction fails
    if (!name && productName) {
      name = productName;
      console.log(`Using provided product name: ${name}`);
    }
    
    if (!name) {
      console.log('Could not extract or use product name');
      return null;
    }

    // Extract price (cost price from HubJoias) - improved patterns
    let costPrice = 0;
    let priceSource: 'jsonld' | 'meta' | 'regex' | 'estimated' = 'estimated';
    const pricePatterns = [
      // Strict: within WooCommerce price elements only
      /<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>[\s\S]*?<bdi>\s*(?:R\$\s*)?([0-9.,]+)/i,
      /<p[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]*?<bdi>\s*(?:R\$\s*)?([0-9.,]+)/i,
    ];
    
    console.log('Searching for price in HTML...');
    const searchHtml = getMainProductPriceHtml(html) || html;
    console.log('Using main product section:', searchHtml !== html);

    // 1) Try JSON-LD first (most reliable)
    let jsonLdPrice = extractPriceFromJsonLd(searchHtml) ?? extractPriceFromJsonLd(html);
    if (jsonLdPrice && jsonLdPrice > 0) {
      costPrice = jsonLdPrice;
      priceSource = 'jsonld';
      console.log(`Price from JSON-LD: R$ ${costPrice}`);
    }

    // 2) Try meta tags
    if (costPrice === 0) {
      const metaPrice = extractPriceFromMetaTags(searchHtml) ?? extractPriceFromMetaTags(html);
      if (metaPrice && metaPrice > 0) {
        costPrice = metaPrice;
        priceSource = 'meta';
        console.log(`Price from META: R$ ${costPrice}`);
      }
    }

    // 3) Fallback to regex patterns in the main section
    if (costPrice === 0) {
      for (let i = 0; i < pricePatterns.length; i++) {
        const pattern = pricePatterns[i];
        const match = searchHtml.match(pattern);
        if (match && match[1]) {
          const cleanPrice = match[1].replace(/[^\d,]/g, '').replace(',', '.');
          const price = parseFloat(cleanPrice);
          if (!isNaN(price) && price > 0) {
            costPrice = price;
            priceSource = 'regex';
            console.log(`Found cost price with pattern ${i + 1}: R$ ${costPrice}`);
            break;
          }
        }
      }
    }

    if (costPrice === 0) {
      console.log('Could not extract cost price, trying fallback methods...');
      
      // Try to find any price mentioned in the page with broader search
      const fallbackPricePatterns = [
        // Look for prices in specific HubJoias format
        /R\$\s*(\d{1,3}(?:,\d{3})*(?:,\d{2})?)/g,
        /(\d{1,3}(?:,\d{3})*,\d{2})/g,
        // Standard decimal format  
        /(\d+\.\d{2})/g,
        // Any reasonable price range for jewelry
        /\b(\d{2,3})[,.](\d{2})\b/g,
      ];
      
      for (const pattern of fallbackPricePatterns) {
        const priceMatches = [...searchHtml.matchAll(pattern)];
        if (priceMatches && priceMatches.length > 0) {
          // Use the first reasonable price found
          for (const match of priceMatches) {
            let priceStr = match[1];
            if (match[2]) priceStr += '.' + match[2]; // Add decimal part
            
            let price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
            
            // HubJoias typical wholesale price range
            if (price >= 15 && price <= 200) { 
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
      console.log('Still no price found, using HubJoias estimated pricing...');
      
      // HubJoias typical pricing by product type
      const lowerName = name.toLowerCase();
      if (lowerName.includes('brinco') || lowerName.includes('argolinha')) {
        costPrice = 32.00; // Typical earring wholesale price
      } else if (lowerName.includes('anel')) {
        costPrice = 45.00; // Typical ring wholesale price  
      } else if (lowerName.includes('colar')) {
        costPrice = 55.00; // Typical necklace wholesale price
      } else if (lowerName.includes('pulseira')) {
        costPrice = 48.00; // Typical bracelet wholesale price
      } else {
        costPrice = 39.00; // Default jewelry wholesale price
      }
      priceSource = 'estimated';
      console.log(`Using estimated cost price for ${name}: R$ ${costPrice}`);
    }

    // Aceitar preço de alta confiança: JSON-LD, META ou HTML do bloco principal
    if (priceSource !== 'jsonld' && priceSource !== 'meta' && priceSource !== 'regex') {
      throw new Error('Preço não encontrado com alta confiança (JSON-LD/META/HTML).');
    }

    // Calculate sale price with appropriate margin (150-200%)
    const salePrice = Math.round(costPrice * 4.2); // 320% margin for jewelry

    // Extract weight from product specifications
    let weight = 0;
    const weightPatterns = [
      /peso[^:]*:\s*([0-9,]+)\s*g/i,
      /gramatura[^:]*:\s*([0-9,]+)\s*g/i,
      /([0-9,]+)\s*gramas?/i,
      /weight[^:]*:\s*([0-9,]+)/i,
      /(\d+\.?\d*)\s*g\b/i
    ];
    
    for (const pattern of weightPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleanWeight = match[1].replace(',', '.');
        const extractedWeight = parseFloat(cleanWeight);
        if (!isNaN(extractedWeight) && extractedWeight > 0 && extractedWeight < 50) {
          weight = extractedWeight;
          console.log(`Found weight: ${weight}g`);
          break;
        }
      }
    }

    // Use realistic default weights based on product type (HubJoias typical weights)
    if (weight === 0 || weight > 50) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('brinco') || lowerName.includes('argolinha')) {
        weight = 1.5; // Typical earring weight from HubJoias
      } else if (lowerName.includes('anel')) {
        weight = 2.0; // Typical ring weight
      } else if (lowerName.includes('colar')) {
        weight = 3.5; // Typical necklace weight
      } else if (lowerName.includes('pulseira')) {
        weight = 2.8; // Typical bracelet weight
      } else if (lowerName.includes('piercing')) {
        weight = 0.8; // Typical piercing weight
      } else {
        weight = 1.5; // Default lightweight jewelry weight
      }
      console.log(`Using estimated weight for ${name}: ${weight}g`);
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

    console.log(`Successfully extracted data for ${sku || productName}: ${name}, Cost: R$ ${costPrice}, Sale: R$ ${salePrice}, Weight: ${weight}g`);

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