// Maa Sukriti Pharmaceuticals - Products & Categories Logic

// Helper to validate if an image URL is correct and has a filename
function isValidImageUrl(url) {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  
  // Exclude empty folder paths
  if (clean === '/assets/uploads/products/' || clean === '/assets/uploads/products' || clean.endsWith('/')) return false;
  if (clean.includes('undefined') || clean.includes('null')) return false;
  
  // Data URLs are always valid
  if (clean.startsWith('data:')) return true;
  
  // Remove query parameters and hashes for extension checking
  const pathname = clean.split('?')[0].split('#')[0];
  
  return pathname.endsWith('.jpg') || 
         pathname.endsWith('.jpeg') || 
         pathname.endsWith('.png') || 
         pathname.endsWith('.gif') || 
         pathname.endsWith('.webp') || 
         pathname.endsWith('.svg') ||
         pathname.endsWith('.bmp');
}

// Helper to generate a clean URL-friendly category slug
function makeCategorySlug(name) {
  if (!name) return "";
  return name.toLowerCase()
             .trim()
             .replace(/[^a-z0-9]+/g, '-')
             .replace(/^-+|-+$/g, '');
}

// Default Mock Data for local fallback (Demo Mode)
const DEFAULT_MOCK_CATEGORIES = [
  { id: "cat_1", name: "Tablets", status: "active" },
  { id: "cat_2", name: "Capsules", status: "active" },
  { id: "cat_3", name: "Syrups", status: "active" },
  { id: "cat_4", name: "Injections", status: "active" },
  { id: "cat_5", name: "Ayurvedic", status: "active" },
  { id: "cat_6", name: "Veterinary", status: "active" }
];

const DEFAULT_MOCK_PRODUCTS = [
  {
    id: "p_1",
    name: "Paracetamol 650mg Tablets",
    category: "Tablets",
    composition: "Paracetamol IP 650mg",
    description: "Effective antipyretic and analgesic formulation. Indicated for fast relief from high fever, body pain, headache, and minor muscular aches.",
    packaging: "10 x 10 Blister Pack",
    imageUrl: "",
    pdfUrl: "",
    featured: true,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_2",
    name: "Amoxicillin 500mg Capsules",
    category: "Capsules",
    composition: "Amoxicillin Trihydrate IP 500mg",
    description: "Broad-spectrum penicillin antibiotic used to treat bacterial infections of the ear, nose, throat, urinary tract, and respiratory tract.",
    packaging: "10 x 10 Blister Pack",
    imageUrl: "",
    pdfUrl: "",
    featured: true,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_3",
    name: "Pantoprazole 40mg Tablets",
    category: "Tablets",
    composition: "Pantoprazole Sodium IP 40mg",
    description: "Proton pump inhibitor (PPI) that decreases the amount of acid produced in the stomach. Prescribed for GERD, acid reflux, and peptic ulcers.",
    packaging: "10 x 10 Alu-Alu Pack",
    imageUrl: "",
    pdfUrl: "",
    featured: true,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_4",
    name: "Cough & Cold Liquid Oral",
    category: "Syrups",
    composition: "Dextromethorphan HBr 10mg + Phenylephrine HCl 5mg + Chlorpheniramine Maleate 2mg per 5ml",
    description: "Advanced non-drowsy formulation for quick symptomatic relief from dry cough, nasal congestion, throat irritation, and sneezing.",
    packaging: "100 ml Pet Bottle",
    imageUrl: "",
    pdfUrl: "",
    featured: false,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_5",
    name: "Multivitamin & Antioxidant Softgels",
    category: "Capsules",
    composition: "Ginseng + Ginkgo Biloba + Green Tea Extract + Multivitamins + Minerals",
    description: "Premium daily health supplement designed to boost immunity, improve cognitive performance, and reduce oxidative stress.",
    packaging: "3 x 10 Blister Pack",
    imageUrl: "",
    pdfUrl: "",
    featured: true,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_6",
    name: "Ceftriaxone 1g Injection",
    category: "Injections",
    composition: "Ceftriaxone Sodium IP 1g",
    description: "Sterile cephalosporin antibiotic injection. Prescribed for severe bacterial infections including meningitis, sepsis, and surgical prophylaxis.",
    packaging: "Single Vial with WFI (Water for Injection)",
    imageUrl: "",
    pdfUrl: "",
    featured: true,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_7",
    name: "B-Complex with L-Lysine Syrup",
    category: "Syrups",
    composition: "Thiamine 2mg + Riboflavin 2mg + Niacinamide 15mg + L-Lysine 100mg per 5ml",
    description: "Essential vitamin B formulation enriched with amino acids. Promotes metabolic health, increases appetite, and treats nutritional deficiencies.",
    packaging: "200 ml Bottle",
    imageUrl: "",
    pdfUrl: "",
    featured: true,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_8",
    name: "Pure Ashwagandha Extract Capsules",
    category: "Ayurvedic",
    composition: "Withania Somnifera (Ashwagandha) Root Extract 500mg",
    description: "Natural adaptogenic supplement. Helps reduce stress and anxiety, enhances muscle strength, boosts cognitive focus, and improves general energy.",
    packaging: "60 Veggie Capsules Bottle",
    imageUrl: "",
    pdfUrl: "",
    featured: false,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "p_9",
    name: "Tulsi & Honey Herbal Cough Remedy",
    category: "Ayurvedic",
    composition: "Ocimum Sanctum (Tulsi) + Adhatoda Vasica (Vasaka) + Honey base",
    description: "Pure Ayurvedic cough syrup. Relieves chest congestion, liquefies sputum, and soothes dry throat without drowsiness side effects.",
    packaging: "100 ml Pet Bottle",
    imageUrl: "",
    pdfUrl: "",
    featured: true,
    status: "active",
    createdAt: new Date().toISOString()
  }
];

// Database state managers (kept for fallback compatibility)
function getLocalCategories() {
  const stored = localStorage.getItem("local_categories");
  if (!stored) {
    localStorage.setItem("local_categories", JSON.stringify(DEFAULT_MOCK_CATEGORIES));
    return DEFAULT_MOCK_CATEGORIES;
  }
  return JSON.parse(stored);
}

function getLocalProducts() {
  const stored = localStorage.getItem("local_products");
  if (!stored) {
    localStorage.setItem("local_products", JSON.stringify(DEFAULT_MOCK_PRODUCTS));
    return DEFAULT_MOCK_PRODUCTS;
  }
  return JSON.parse(stored);
}

// Fetch all active categories
async function fetchCategories() {
  try {
    const res = await fetch('/api/categories', {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (e) {
    console.error("Categories API load error: ", e);
    return getLocalCategories().filter(c => c.status === "active");
  }
}

// Fetch all active products
async function fetchProducts(all = false) {
  try {
    const res = await fetch(all ? '/api/products?all=true' : '/api/products', {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (e) {
    console.error("Products API load error: ", e);
    const local = getLocalProducts();
    return all ? local : local.filter(p => p.status === "active");
  }
}

// Get Featured products
async function fetchFeaturedProducts() {
  const allProds = await fetchProducts();
  return allProds.filter(p => p.featured === true || p.featured === "true");
}

// Get Single Product by ID or Slug
async function fetchProductById(idOrSlug, isSlug = false) {
  try {
    const param = isSlug ? `slug=${idOrSlug}` : `id=${idOrSlug}`;
    const res = await fetch(`/api/product?${param}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch product details');
    return await res.json();
  } catch (e) {
    console.error("Get product detail API error: ", e);
    const all = getLocalProducts();
    if (isSlug) {
      return all.find(p => p.slug === idOrSlug || makeSlug(p.name) === idOrSlug);
    }
    return all.find(p => p.id === idOrSlug);
  }
}

// Render dynamic elements
document.addEventListener("DOMContentLoaded", async () => {
  // Page check
  const path = window.location.pathname;
  const isIndex = path === '/' || path.endsWith('/index') || path.includes('index.html') || path === '';
  const isProducts = path.includes('/products') || path.includes('products.html');
  const isDetails = path.includes('/product/') || path.includes('product-details.html');
  
  // 1. HOME PAGE RENDERING
  if (isIndex) {
    // Render categories dynamically on homepage
    const homepageCategories = document.getElementById("homepageCategories");
    if (homepageCategories) {
      try {
        const categories = await fetchCategories();
        homepageCategories.innerHTML = "";
        
        // Prioritized emoji mapping function
        function getCategoryEmoji(catName) {
          const name = catName.toLowerCase().trim();
          if (name.includes("tablet")) return "💊";
          if (name.includes("capsule")) return "🧪";
          if (name.includes("syrup")) return "🍷";
          if (name.includes("injection")) return "💉";
          if (name.includes("ayurvedic") || name.includes("herbal")) return "🌿";
          if (name.includes("veterinary") || name.includes("vetenary") || name.includes("animal")) return "🐾";
          if (name.includes("bandage")) return "🩹";
          if (name.includes("surgical tape")) return "🩹";
          if (name.includes("vitamin") || name.includes("supplement")) return "💊";
          if (name.includes("nasal") || name.includes("drop")) return "💧";
          if (name.includes("eye") || name.includes("ophthalmology")) return "👁️";
          if (name.includes("gynecology") || name.includes("hormonal")) return "🤰";
          if (name.includes("instrument")) return "🩺";
          if (name.includes("oncology") || name.includes("cytotoxic")) return "🔬";
          if (name.includes("orthopedics") || name.includes("musculoskeletal") || name.includes("bone")) return "🦴";
          if (name.includes("psychiatry") || name.includes("neurology") || name.includes("brain")) return "🧠";
          return "📦"; // Default
        }
        
        // Filter out inactive categories
        const activeCats = categories.filter(c => c.status === "active" || c.status === true || c.status === "true");
        
        // Define sorting order for homepage divisions to prioritize top 6-8 categories
        const HOME_CATEGORY_ORDER = [
          "Tablets", 
          "Capsules", 
          "Syrups", 
          "Injections", 
          "Ayurvedic", 
          "Vitamins / Supplements", 
          "Surgical Tapes", 
          "Bandages"
        ];
        
        activeCats.sort((a, b) => {
          const indexA = HOME_CATEGORY_ORDER.findIndex(cat => cat.toLowerCase() === a.name.toLowerCase());
          const indexB = HOME_CATEGORY_ORDER.findIndex(cat => cat.toLowerCase() === b.name.toLowerCase());
          const valA = indexA === -1 ? 999999 : indexA;
          const valB = indexB === -1 ? 999999 : indexB;
          return valA - valB;
        });

        // Limit to top 6 categories for a professional, compact layout
        const catsToDisplay = activeCats.slice(0, 6);

        catsToDisplay.forEach(cat => {
          const emoji = getCategoryEmoji(cat.name);
          homepageCategories.innerHTML += `
            <div class="category-card" onclick="window.location.href='/products/${makeCategorySlug(cat.name)}'">
              <span class="category-card-icon">${emoji}</span>
              <div class="category-card-name">${cat.name}</div>
            </div>
          `;
        });
      } catch (err) {
        console.error("Error loading categories dynamically:", err);
      }
    }

    const featuredContainer = document.getElementById("featuredProductsContainer");
    if (featuredContainer) {
      const featured = await fetchFeaturedProducts();
      if (featured.length === 0) {
        featuredContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--gray-dark);">No featured products available currently.</div>`;
      } else {
        featuredContainer.innerHTML = "";
        
        const CATEGORY_ORDER = ["Tablets", "Capsules", "Syrups", "Injections", "Ayurvedic"];
        
        // Find represented categories in featured products
        const representedCategories = [...new Set(featured.map(p => p.category))];
        
        // Sort categories based on required order
        const sortedCategories = [];
        CATEGORY_ORDER.forEach(cat => {
          const found = representedCategories.find(c => c.toLowerCase() === cat.toLowerCase());
          if (found) {
            sortedCategories.push(found);
          }
        });
        representedCategories.forEach(cat => {
          if (!sortedCategories.some(c => c.toLowerCase() === cat.toLowerCase())) {
            sortedCategories.push(cat);
          }
        });
        
        const isMobile = window.innerWidth <= 768;
        
        let html = "";
        sortedCategories.forEach(catName => {
          const productsInCat = featured.filter(p => p.category.toLowerCase() === catName.toLowerCase());
          
          if (productsInCat.length > 0) {
            // Sort products by display_order ASC, then by name ASC
            productsInCat.sort((a, b) => {
              const orderA = parseInt(a.displayOrder) || 999999;
              const orderB = parseInt(b.displayOrder) || 999999;
              if (orderA !== orderB) {
                return orderA - orderB;
              }
              return a.name.localeCompare(b.name);
            });
            
            // Render Category Heading
            html += `
              <div class="category-section-header" style="grid-column: 1 / -1; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem;">
                <h3 style="font-size: 1.5rem; color: var(--primary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin: 0;">
                  ${catName}
                </h3>
              </div>
            `;
            
            // If mobile, show only the first featured product card
            const productsToDisplay = isMobile ? productsInCat.slice(0, 1) : productsInCat;
            
            // Render products
            productsToDisplay.forEach(p => {
              html += generateProductCardHTML(p);
            });
            
            // Add redirect to full catalog category page (renders on both mobile and desktop)
            html += `
              <div class="homepage-view-all-wrapper" style="grid-column: 1 / -1; text-align: center; margin: 1rem 0 2rem 0; width: 100%;">
                <button onclick="window.location.href='/products/${makeCategorySlug(catName)}'" class="btn btn-outline" style="width: 100%; max-width: 320px; font-weight: 700; padding: 0.6rem var(--spacing-sm); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; border-color: var(--primary); color: var(--primary);">
                  View All ${catName} →
                </button>
              </div>
            `;
          }
        });
        
        featuredContainer.innerHTML = html;
        lucide.createIcons();
      }
    }
  }
  
  // 2. PRODUCT DETAILS RENDERING
  if (isDetails) {
    let idOrSlug = null;
    let isSlug = false;
    
    if (path.includes('/product/')) {
      idOrSlug = path.split('/product/').pop().split('/').shift();
      isSlug = true;
    } else {
      const params = new URLSearchParams(window.location.search);
      idOrSlug = params.get("id");
      isSlug = false;
    }
    
    if (idOrSlug) {
      const product = await fetchProductById(idOrSlug, isSlug);
      if (product) {
        window.currentProductId = product.id;
        window.currentProductImageUrl = product.imageUrl;
        document.getElementById("bannerTitle").innerText = product.name;
        document.getElementById("breadcrumbActive").innerText = product.name;
        document.getElementById("detailName").innerText = product.name;
        document.getElementById("detailCategory").innerText = product.category;
        document.getElementById("detailComposition").innerText = product.composition;
        document.getElementById("detailPackaging").innerText = product.packaging;
        document.getElementById("tabDescription").innerText = product.description;
        
        // Dynamically update document title & meta tags for SEO
        document.title = "Maa Sukriti Pharmaceuticals";
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute("content", `${product.name} (${product.composition}) - WHO-GMP certified formulation from Maa Sukriti Pharmaceuticals. Packaging: ${product.packaging}. ${product.description}`);
        }

        // Update keywords meta tag for SEO
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords && product.tags) {
          metaKeywords.setAttribute("content", product.tags + ", " + metaKeywords.getAttribute("content"));
        }
        
        // Dynamic Open Graph updates
        const ogTitle = document.getElementById("ogTitle");
        const ogDesc = document.getElementById("ogDesc");
        const ogImage = document.getElementById("ogImage");
        if (ogTitle) ogTitle.setAttribute("content", `${product.name} | Maa Sukriti Pharmaceuticals`);
        if (ogDesc) ogDesc.setAttribute("content", `View composition and details for ${product.name} (${product.composition}). WHO-GMP certified manufacture.`);
        if (ogImage && product.imageUrl) ogImage.setAttribute("content", product.imageUrl);
        
        // Dynamic Twitter updates
        const twitterTitle = document.getElementById("twitterTitle");
        const twitterDesc = document.getElementById("twitterDesc");
        const twitterImage = document.getElementById("twitterImage");
        if (twitterTitle) twitterTitle.setAttribute("content", `${product.name} | Maa Sukriti Pharmaceuticals`);
        if (twitterDesc) twitterDesc.setAttribute("content", `View composition and details for ${product.name} (${product.composition}).`);
        if (twitterImage && product.imageUrl) twitterImage.setAttribute("content", product.imageUrl);
        
        // Inject Product JSON-LD Schema
        let schemaScript = document.getElementById("productDetailsSchema");
        if (!schemaScript) {
          schemaScript = document.createElement("script");
          schemaScript.id = "productDetailsSchema";
          schemaScript.type = "application/ld+json";
          document.head.appendChild(schemaScript);
        }
        schemaScript.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": product.imageUrl || "https://mspharma.in/assets/logos/logo.png",
          "description": product.description,
          "category": product.category,
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "INR",
            "lowPrice": "0",
            "offerCount": "1",
            "seller": {
              "@type": "Organization",
              "name": "Maa Sukriti Pharmaceuticals"
            }
          }
        });
        
        // Image setup
        const detailImg = document.getElementById("detailImage");
        const thumbContainer = document.getElementById("galleryThumbnailsContainer");
        
        let images = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
          images = product.images.map(img => {
            if (!img) return '';
            const fullUrl = img.startsWith('http') || img.startsWith('/') ? img : `/assets/uploads/products/${img}`;
            return isValidImageUrl(fullUrl) ? fullUrl : '';
          }).filter(Boolean);
        } else if (product.imageUrl) {
          const img = product.imageUrl;
          const fullUrl = img.startsWith('http') || img.startsWith('/') ? img : `/assets/uploads/products/${img}`;
          if (isValidImageUrl(fullUrl)) {
            images = [fullUrl];
          }
        }
        
        window.activeImageIndex = 0;
        
        if (images.length > 0) {
          detailImg.src = images[0];
          detailImg.style.cursor = "pointer";
          detailImg.onclick = () => {
            openLightbox(images, window.activeImageIndex);
          };
          
          if (images.length > 1 && thumbContainer) {
            thumbContainer.innerHTML = "";
            thumbContainer.style.display = "flex";
            images.forEach((imgUrl, index) => {
              const thumb = document.createElement("div");
              thumb.className = "gallery-thumb" + (index === 0 ? " active" : "");
              thumb.innerHTML = `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
              thumb.onclick = () => {
                window.activeImageIndex = index;
                detailImg.style.opacity = "0.5";
                setTimeout(() => {
                  detailImg.src = imgUrl;
                  detailImg.style.opacity = "1";
                }, 150);
                
                // update active class
                document.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
              };
              thumbContainer.appendChild(thumb);
            });
          } else if (thumbContainer) {
            thumbContainer.style.display = "none";
          }
        } else {
          detailImg.src = `data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' fill='%23f1f5f9'/><text x='50' y='55' font-size='28' text-anchor='middle'>💊</text></svg>`;
          detailImg.style.cursor = "default";
          detailImg.onclick = null;
          if (thumbContainer) thumbContainer.style.display = "none";
        }
        
        // Brochure Setup
        const pdfContainer = document.getElementById("pdfDownloadContainer");
        const brochureLink = document.getElementById("brochureLink");
        if (product.pdfUrl) {
          pdfContainer.style.display = "flex";
          brochureLink.href = product.pdfUrl;
        } else {
          pdfContainer.style.display = "none";
        }
      } else {
        document.getElementById("productDetailsWrapper").innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:4rem;"><h3>Product not found!</h3><br><a href="/products" class="btn btn-primary">Return to Catalog</a></div>`;
      }
    } else {
      window.location.href = "/products";
    }
  }
});

// Card HTML Generator Helper
function generateProductCardHTML(p) {
  const validImage = isValidImageUrl(p.imageUrl) ? p.imageUrl : '';
  const imageTag = validImage 
    ? `<img src="${validImage}" alt="${p.name}" loading="lazy">` 
    : `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:50%; height:50%; margin:auto;"><rect width="100%" height="100%" fill="none"/><text x="50" y="55" font-size="36" text-anchor="middle">💊</text></svg>`;
  
  const isFeaturedTag = (p.featured === true || p.featured === "true") 
    ? `<span class="product-badge-featured">Featured</span>` 
    : ``;
    
  return `
    <div class="product-card" id="card_${p.id}">
      <div class="product-image-container" style="cursor: pointer;" onclick="window.location.href='/product/${p.slug || p.id}'">
        ${imageTag}
      </div>
      <div class="product-content">
        <span class="product-category">${p.category}</span>
        <h4 class="product-title" style="cursor: pointer;" onclick="window.location.href='/product/${p.slug || p.id}'">${p.name}</h4>
        <div class="product-composition" title="${p.composition}">${p.composition}</div>
        <p class="product-desc">${p.description}</p>
        
        <div class="product-footer">
          <a href="/product/${p.slug || p.id}" class="btn btn-outline btn-sm">Details</a>
          <button class="btn btn-primary btn-sm" onclick="addToEnquiryCartDirect('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.category}', '${validImage}')">
            <i data-lucide="shopping-cart"></i> Add
          </button>
        </div>
      </div>
    </div>
  `;
}

// Add to Enquiry Cart Helper
function addToEnquiryCartDirect(id, name, category, imageUrl = "") {
  addToCart(id, name, category, 10, imageUrl); // default qty is 10 packs
  showToastNotification(`Added ${name} to Cart`, "check-circle", "toast-success");
}

function addProductToEnquiryCart() {
  const params = new URLSearchParams(window.location.search);
  const id = window.currentProductId || params.get("id");
  const name = document.getElementById("detailName").innerText;
  const category = document.getElementById("detailCategory").innerText;
  const qty = parseInt(document.getElementById("detailQty").value) || 10;
  
  if (!id) {
    showToastNotification("Could not identify product.", "alert-triangle", "toast-error");
    return;
  }
  
  const imageUrl = window.currentProductImageUrl || "";
  addToCart(id, name, category, qty, imageUrl);
  showToastNotification(`Added ${qty} packs of ${name} to Enquiry Cart.`, "check-circle", "toast-success");
}

// Direct Enquiry trigger
function sendDirectWhatsappEnquiry() {
  const name = document.getElementById("detailName").innerText;
  const qty = document.getElementById("detailQty").value || 10;
  
  const msg = `Hello Maa Sukriti Pharmaceuticals,\n\nI am interested in the following product:\n1. ${name} - ${qty} Packs\n\nPlease share availability and quote details.`;
  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/919415021041?text=${encoded}`, '_blank');
}

// Lightbox Gallery Functions
window.lightboxImages = [];
window.lightboxActiveIndex = 0;

function openLightbox(imagesList, startIndex = 0) {
  const modal = document.getElementById("lightboxModal");
  if (!modal) return;
  
  window.lightboxImages = imagesList;
  window.lightboxActiveIndex = startIndex;
  
  // Render thumbnails inside the lightbox
  const thumbsContainer = document.getElementById("lightboxThumbs");
  if (thumbsContainer) {
    thumbsContainer.innerHTML = "";
    if (imagesList.length > 1) {
      imagesList.forEach((imgUrl, idx) => {
        const thumb = document.createElement("div");
        thumb.className = "lightbox-thumb" + (idx === startIndex ? " active" : "");
        thumb.innerHTML = `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        thumb.onclick = () => {
          updateLightboxImage(idx);
        };
        thumbsContainer.appendChild(thumb);
      });
    }
  }
  
  // Show / Hide navigation buttons if there's only 1 image
  const prevBtn = document.querySelector(".lightbox-prev");
  const nextBtn = document.querySelector(".lightbox-next");
  if (prevBtn && nextBtn) {
    if (imagesList.length <= 1) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    } else {
      prevBtn.style.display = "flex";
      nextBtn.style.display = "flex";
    }
  }
  
  updateLightboxImage(startIndex);
  modal.style.display = "flex";
}

function updateLightboxImage(index) {
  if (index < 0 || index >= window.lightboxImages.length) return;
  window.lightboxActiveIndex = index;
  
  const imgElement = document.getElementById("lightboxImage");
  if (imgElement) {
    imgElement.style.opacity = "0.5";
    setTimeout(() => {
      imgElement.src = window.lightboxImages[index];
      imgElement.style.opacity = "1";
    }, 100);
  }
  
  // Update active class on thumbs
  document.querySelectorAll(".lightbox-thumb").forEach((t, idx) => {
    if (idx === index) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });
}

function closeLightbox() {
  const modal = document.getElementById("lightboxModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function navigateLightbox(direction) {
  if (window.lightboxImages.length <= 1) return;
  let newIndex = window.lightboxActiveIndex + direction;
  if (newIndex < 0) {
    newIndex = window.lightboxImages.length - 1;
  } else if (newIndex >= window.lightboxImages.length) {
    newIndex = 0;
  }
  updateLightboxImage(newIndex);
}

// Expose functions globally for HTML inline onclick handlers
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;
window.openLightbox = openLightbox;

// Close lightbox when clicking outside the image content
window.addEventListener("click", (e) => {
  const modal = document.getElementById("lightboxModal");
  if (e.target === modal) {
    closeLightbox();
  }
});

// Close lightbox on Escape key, navigate on Arrow keys
window.addEventListener("keydown", (e) => {
  const modal = document.getElementById("lightboxModal");
  if (modal && modal.style.display === "flex") {
    if (e.key === "Escape") {
      closeLightbox();
    } else if (e.key === "ArrowLeft") {
      navigateLightbox(-1);
    } else if (e.key === "ArrowRight") {
      navigateLightbox(1);
    }
  }
});
