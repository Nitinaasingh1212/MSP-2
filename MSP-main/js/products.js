// Maa Sukriti Pharmaceuticals - Products & Categories Logic

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

// Get Single Product by ID
async function fetchProductById(id) {
  try {
    const res = await fetch(`/api/product?id=${id}`, {
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
    return all.find(p => p.id === id);
  }
}

// Render dynamic elements
document.addEventListener("DOMContentLoaded", async () => {
  // Page check
  const path = window.location.pathname;
  const isIndex = path.includes("index.html") || path.endsWith("/");
  const isProducts = path.includes("products.html");
  const isDetails = path.includes("product-details.html");
  
  // 1. HOME PAGE RENDERING
  if (isIndex) {
    const featuredContainer = document.getElementById("featuredProductsContainer");
    if (featuredContainer) {
      const featured = await fetchFeaturedProducts();
      if (featured.length === 0) {
        featuredContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--gray-dark);">No featured products available currently.</div>`;
      } else {
        featuredContainer.innerHTML = "";
        featured.slice(0, 6).forEach(p => {
          featuredContainer.innerHTML += generateProductCardHTML(p);
        });
        lucide.createIcons();
      }
    }
  }
  
  // 2. PRODUCT DETAILS RENDERING
  if (isDetails) {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get("id");
    if (prodId) {
      const product = await fetchProductById(prodId);
      if (product) {
        document.getElementById("bannerTitle").innerText = product.name;
        document.getElementById("breadcrumbActive").innerText = product.name;
        document.getElementById("detailName").innerText = product.name;
        document.getElementById("detailCategory").innerText = product.category;
        document.getElementById("detailComposition").innerText = product.composition;
        document.getElementById("detailPackaging").innerText = product.packaging;
        document.getElementById("tabDescription").innerText = product.description;
        
        // Image setup
        const detailImg = document.getElementById("detailImage");
        if (product.imageUrl) {
          detailImg.src = product.imageUrl;
        } else {
          // Default SVG icon placeholder matching category
          detailImg.src = `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50" y="55" font-size="28" text-anchor="middle">💊</text></svg>`;
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
        document.getElementById("productDetailsWrapper").innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:4rem;"><h3>Product not found!</h3><br><a href="products.html" class="btn btn-primary">Return to Catalog</a></div>`;
      }
    } else {
      window.location.href = "products.html";
    }
  }
});

// Card HTML Generator Helper
function generateProductCardHTML(p) {
  const imageTag = p.imageUrl 
    ? `<img src="${p.imageUrl}" alt="${p.name}">` 
    : `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:50%; height:50%; margin:auto;"><rect width="100%" height="100%" fill="none"/><text x="50" y="55" font-size="36" text-anchor="middle">💊</text></svg>`;
  
  const isFeaturedTag = (p.featured === true || p.featured === "true") 
    ? `<span class="product-badge-featured">Featured</span>` 
    : ``;
    
  return `
    <div class="product-card" id="card_${p.id}">
      <div class="product-image-container">
        <span class="product-tag">${p.category}</span>
        ${isFeaturedTag}
        ${imageTag}
      </div>
      <div class="product-content">
        <span class="product-category">${p.category}</span>
        <h4 class="product-title">${p.name}</h4>
        <div class="product-composition" title="${p.composition}">${p.composition}</div>
        <p class="product-desc">${p.description}</p>
        
        <div class="product-footer">
          <a href="product-details.html?id=${p.id}" class="btn btn-outline btn-sm">Details</a>
          <button class="btn btn-primary btn-sm" onclick="addToEnquiryCartDirect('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.category}')">
            <i data-lucide="shopping-cart"></i> Add
          </button>
        </div>
      </div>
    </div>
  `;
}

// Add to Enquiry Cart Helper
function addToEnquiryCartDirect(id, name, category) {
  addToCart(id, name, category, 10); // default qty is 10 packs
  showToastNotification(`Added ${name} to Cart`, "check-circle", "toast-success");
}

function addProductToEnquiryCart() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const name = document.getElementById("detailName").innerText;
  const category = document.getElementById("detailCategory").innerText;
  const qty = parseInt(document.getElementById("detailQty").value) || 10;
  
  addToCart(id, name, category, qty);
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
