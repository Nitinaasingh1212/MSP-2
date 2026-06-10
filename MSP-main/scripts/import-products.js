const https = require('https');
const path = require('path');
const db = require('../lib/db');

// Helper to make HTTP GET requests
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Failed to fetch ${url}, status code: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

// Helper to generate slugs
function generateSlug(name) {
  return name.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric
    .replace(/[\s_]+/g, '-')   // spaces/underscores to hyphens
    .replace(/-+/g, '-');      // duplicate hyphens
}

// Function to delay execution (rate limiting)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startImport(logFn = console.log) {
  logFn('Starting automated product import from mspbharat.com/our-products/ ...');
  
  try {
    // 1. Fetch main products listing page
    logFn('Fetching main products listing page...');
    const listingHtml = await httpGet('https://mspbharat.com/our-products/');
    
    // 2. Extract unique product detail page links
    const urlRegex = /href="(https:\/\/mspbharat.com\/product\/[^"\/]+\/)"/g;
    let match;
    const productUrls = [];
    while ((match = urlRegex.exec(listingHtml)) !== null) {
      const productUrl = match[1];
      if (!productUrls.includes(productUrl)) {
        productUrls.push(productUrl);
      }
    }
    
    logFn(`Found ${productUrls.length} unique product URLs. Beginning scrape...`);
    
    // 3. Loop through product URLs in sequence
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      const displayOrder = i + 1; // Preserve exact sequence order
      logFn(`[${displayOrder}/${productUrls.length}] Scraping: ${url}`);
      
      try {
        const detailHtml = await httpGet(url);
        
        // A. Extract Product Title
        const titleMatch = detailHtml.match(/<h1 class="product_title entry-title">([^<]+)<\/h1>/i);
        if (!titleMatch) {
          logFn(`WARNING: Could not extract title for product at ${url}, skipping.`);
          continue;
        }
        const productName = titleMatch[1].trim();
        
        // B. Extract Category
        let category = 'Uncategorized';
        const catMatch = detailHtml.match(/Category:\s*<a href="[^"]+" rel="tag">([^<]+)<\/a>/i);
        if (catMatch) {
          category = catMatch[1].trim();
        } else {
          // Fallback check: look inside woocommerce-breadcrumb
          const breadMatch = detailHtml.match(/<nav class="woocommerce-breadcrumb"[\s\S]+?\/product-category\/[^"\/]+\/">([^<]+)<\/a>/i);
          if (breadMatch) {
            category = breadMatch[1].trim();
          }
        }
        
        // C. Extract WooCommerce Product Images (up to 3)
        const images = [];
        // Check using data-large_image
        const largeImgRegex = /data-large_image="([^"]+)"/g;
        let imgMatch;
        while ((imgMatch = largeImgRegex.exec(detailHtml)) !== null) {
          const imgUrl = imgMatch[1];
          if (!images.includes(imgUrl) && images.length < 3) {
            images.push(imgUrl);
          }
        }
        
        // If no images found in data-large_image, fall back to general post thumbnail or image tags
        if (images.length === 0) {
          const srcRegex = /class="attachment-full size-full"[^>]*src="([^"]+)"/i;
          const srcMatch = detailHtml.match(srcRegex);
          if (srcMatch) {
            images.push(srcMatch[1]);
          }
        }
        
        const mainImageUrl = images.length > 0 ? images[0] : '';
        
        // D. Extract short description details
        let composition = '';
        let packaging = 'Standard Pack';
        let description = '';
        
        const descBlockMatch = detailHtml.match(/<div class="woocommerce-product-details__short-description">([\s\S]+?)<\/div>/i);
        if (descBlockMatch) {
          const descBlock = descBlockMatch[1];
          
          // Parse Composition
          const compMatch = descBlock.match(/Salt\s+Composition:\s*<\/b>([\s\S]+?)(?:<\/p>|<br>)/i) ||
                            descBlock.match(/Composition:\s*<\/b>([\s\S]+?)(?:<\/p>|<br>)/i) ||
                            descBlock.match(/Composition:<\/strong>([\s\S]+?)(?:<\/p>|<br>)/i) ||
                            descBlock.match(/Composition:([\s\S]+?)(?:<\/p>|<br>)/i);
          if (compMatch) {
            composition = compMatch[1].replace(/<[^>]*>/g, '').trim();
          }
          
          // Parse Packaging
          const packMatch = descBlock.match(/Pack:\s*<\/strong>([\s\S]+?)(?:<\/p>|<br>|<strong>|$)/i) ||
                            descBlock.match(/Packaging:\s*<\/strong>([\s\S]+?)(?:<\/p>|<br>|<strong>|$)/i) ||
                            descBlock.match(/Pack:([\s\S]+?)(?:<\/p>|<br>|<strong>|$)/i);
          if (packMatch) {
            packaging = packMatch[1].replace(/<[^>]*>/g, '').trim();
            // Clean route details if appended
            const routeIdx = packaging.toLowerCase().indexOf('route:');
            if (routeIdx !== -1) {
              packaging = packaging.substring(0, routeIdx).trim();
            }
          }
          
          // Parse Description (remaining parts)
          const paragraphs = descBlock.split(/<\/p>|<br>|<\/div>/i);
          const descParts = [];
          for (let p of paragraphs) {
            const cleanP = p.replace(/<[^>]*>/g, '').trim();
            if (!cleanP) continue;
            if (cleanP.toLowerCase().includes('composition:') || 
                cleanP.toLowerCase().includes('pack:') || 
                cleanP.toLowerCase().includes('packaging:')) {
              continue;
            }
            descParts.push(cleanP);
          }
          description = descParts.join(' ').trim();
        }
        
        // Fallback for empty fields
        if (!composition) composition = 'As directed by Physician';
        if (!description) description = `${productName} is a high-quality formulation manufactured under strict WHO-GMP compliance standards.`;
        
        // E. Unique Slug generation
        const baseSlug = generateSlug(productName);
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          // Check uniqueness in database (excluding checking self if it is an update)
          const [existing] = await db.query('SELECT id FROM products WHERE slug = ? AND name != ?', [slug, productName]);
          if (existing.length === 0) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        // F. Category validation: verify if it exists, create if not
        let catName = category.toUpperCase(); // Maintain uppercase categories standard
        const [existingCat] = await db.query('SELECT id FROM categories WHERE UPPER(name) = ?', [catName]);
        if (existingCat.length === 0) {
          logFn(`Adding new Category/Division: ${catName}`);
          await db.query('INSERT INTO categories (name, status) VALUES (?, ?)', [catName, 'active']);
        }
        
        // G. Insert or update in database
        const [existingProduct] = await db.query('SELECT id FROM products WHERE name = ?', [productName]);
        if (existingProduct.length > 0) {
          const productId = existingProduct[0].id;
          logFn(`Updating existing product: ${productName} (ID: ${productId})`);
          await db.query(
            `UPDATE products 
             SET category = ?, composition = ?, packaging = ?, description = ?, image_url = ?, slug = ?, display_order = ?, images = ?
             WHERE id = ?`,
            [catName, composition, packaging, description, mainImageUrl, slug, displayOrder, JSON.stringify(images), productId]
          );
        } else {
          logFn(`Inserting new product: ${productName}`);
          await db.query(
            `INSERT INTO products (name, category, composition, packaging, featured, status, description, image_url, pdf_url, slug, tags, display_order, images)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productName, catName, composition, packaging, 'false', 'active', description, mainImageUrl, '',
              slug, '', displayOrder, JSON.stringify(images)
            ]
          );
        }
        
      } catch (err) {
        logFn(`ERROR: processing product details for URL: ${url} - ${err.message}`);
      }
      
      // Delay to respect rate limits (250ms delay)
      await delay(250);
    }
    
    logFn('Automated product import completed successfully!');
    return { success: true, count: productUrls.length };
  } catch (error) {
    logFn('Fatal error during product import: ' + error.message);
    throw error;
  }
}

module.exports = startImport;

if (require.main === module) {
  startImport()
    .then((res) => {
      console.log('Done!', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed!', err);
      process.exit(1);
    });
}
