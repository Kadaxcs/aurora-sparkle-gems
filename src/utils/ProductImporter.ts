interface ImportedProduct {
  name: string;
  price: number;
  images: string[];
  description?: string;
  sourceUrl: string;
}

interface ImportResult {
  success: boolean;
  data?: ImportedProduct[];
  error?: string;
}

export class ProductImporter {
  private static readonly HUBJOIAS_BASE_URL = 'https://www.hubjoias.com.br';

  static async extractProductsFromHtml(html: string): Promise<ImportResult> {
    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const products: ImportedProduct[] = [];
      
      // Find product elements (based on the HTML structure we saw)
      let productElements = Array.from(doc.querySelectorAll('.woocommerce-LoopProduct-link, .product-item, .wc-block-grid__product'));
      
      if (productElements.length === 0) {
        // Try alternative selectors
        const altSelectors = [
          'li.product',
          '.product',
          '.woocommerce-loop-product__link',
          '[href*="/produto/"]'
        ];
        
        for (const selector of altSelectors) {
          const elements = Array.from(doc.querySelectorAll(selector));
          if (elements.length > 0) {
            productElements = elements;
            break;
          }
        }
      }

      productElements.forEach((element) => {
        try {
          const link = element as HTMLAnchorElement;
          const href = link.href || link.getAttribute('href');
          
          if (!href || !href.includes('/produto/')) return;
          
          // Extract product name
          const nameElement = element.querySelector('h2, .woocommerce-loop-product__title, .product-title, .entry-title');
          const name = nameElement?.textContent?.trim();
          
          if (!name) return;
          
          // Extract price
          const priceElement = element.querySelector('.price, .woocommerce-Price-amount, .amount, .price-current');
          const priceText = priceElement?.textContent?.trim();
          const price = this.parsePrice(priceText || '');
          
          if (price === 0) return;
          
          // Extract images
          const images: string[] = [];
          const imgElements = element.querySelectorAll('img');
          imgElements.forEach(img => {
            const src = img.src || img.getAttribute('data-src');
            if (src && !src.includes('placeholder')) {
              // Convert relative URLs to absolute
              const absoluteUrl = src.startsWith('http') ? src : `${this.HUBJOIAS_BASE_URL}${src}`;
              images.push(absoluteUrl);
            }
          });
          
          products.push({
            name: name.replace(/^Anel\s+/i, ''), // Remove "Anel" prefix for rings
            price,
            images,
            sourceUrl: href.startsWith('http') ? href : `${this.HUBJOIAS_BASE_URL}${href}`
          });
        } catch (error) {
          console.warn('Error extracting product data:', error);
        }
      });

      return {
        success: true,
        data: products
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async extractProductsFromMarkdown(markdown: string): Promise<ImportResult> {
    try {
      const products: ImportedProduct[] = [];
      const lines = markdown.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for product links in markdown format
        const productMatch = line.match(/\[([^[\]]*Anel[^[\]]*)\]\(([^)]+)\)/i);
        if (productMatch) {
          const fullText = productMatch[1];
          const url = productMatch[2];
          
          // Extract price from the text
          const priceMatch = fullText.match(/R\$\s*([\d,]+\.?\d*)/);
          const price = priceMatch ? this.parsePrice(priceMatch[1]) : 0;
          
          // Extract product name (remove price and clean up)
          const name = fullText
            .replace(/R\$\s*[\d,]+\.?\d*/, '')
            .replace(/^\*\*/, '')
            .replace(/\*\*$/, '')
            .replace(/^Anel\s+/i, '')
            .trim();
          
          if (name && price > 0) {
            // Look for image URLs in nearby lines
            const images: string[] = [];
            for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
              const imageLine = lines[j];
              const imageMatches = imageLine.match(/https:\/\/[^)\s]+\.(?:jpg|jpeg|png|webp)/gi);
              if (imageMatches) {
                images.push(...imageMatches);
              }
            }
            
            products.push({
              name,
              price,
              images: [...new Set(images)], // Remove duplicates
              sourceUrl: url.startsWith('http') ? url : `${this.HUBJOIAS_BASE_URL}${url}`
            });
          }
        }
      }

      return {
        success: true,
        data: products
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private static parsePrice(priceText: string): number {
    if (!priceText) return 0;
    
    // Remove currency symbols and spaces
    const cleanPrice = priceText
      .replace(/R\$/, '')
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.');
    
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  static generateSKU(name: string): string {
    const words = name.split(' ').filter(word => word.length > 2);
    const prefix = words.slice(0, 2).map(word => word.slice(0, 2).toUpperCase()).join('');
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}_HJ`;
  }
}