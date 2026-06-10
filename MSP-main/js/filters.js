// Maa Sukriti Pharmaceuticals - Catalog Filters & Pagination Controller

let activeCategory = "all";
let activeSort = "name-asc";
let searchQuery = "";
let currentPage = 1;
const productsPerPage = 9;

let allCatalogProducts = [];

// Helper to update page titles, meta tags, and breadcrumbs for category pages
function updateSEOHeaders(categoryName) {
  if (categoryName === "All Categories" || categoryName === "all") {
    document.title = "Pharmaceutical Products List & Catalog | Maa Sukriti Pharmaceuticals";
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute("content", "Search and browse through our complete product list of pharmaceutical formulations. Filter by division (tablets, capsules, syrups, injections) or active chemical composition.");
    }
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) {
      ogTitleEl.setAttribute("content", "Pharmaceutical Products List & Catalog | Maa Sukriti Pharmaceuticals");
    }
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) {
      ogDescEl.setAttribute("content", "Browse our complete list of clinical formulations. Search by category, composition, or brand name and request instant quotes.");
    }
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
      breadcrumb.innerHTML = `
        <li><a href="/">Home</a></li>
        <li class="breadcrumb-separator">/</li>
        <li>Products</li>
      `;
    }
  } else {
    document.title = `${categoryName} Formulations | Maa Sukriti Pharmaceuticals`;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute("content", `Explore our complete list of WHO-GMP approved ${categoryName.toLowerCase()} formulations. Detailed composition, packaging specifications, and quick quotation details from Maa Sukriti Pharmaceuticals.`);
    }
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) {
      ogTitleEl.setAttribute("content", `${categoryName} Formulations | Maa Sukriti Pharmaceuticals`);
    }
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) {
      ogDescEl.setAttribute("content", `Explore our complete list of WHO-GMP approved ${categoryName.toLowerCase()} formulations.`);
    }
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
      breadcrumb.innerHTML = `
        <li><a href="/">Home</a></li>
        <li class="breadcrumb-separator">/</li>
        <li><a href="/products">Products</a></li>
        <li class="breadcrumb-separator">/</li>
        <li id="breadcrumbActive">${categoryName}</li>
      `;
    }
  }
}

// Initialize Catalog
async function initCatalog() {
  const container = document.getElementById("catalogProductsContainer");
  if (!container) return; // not on products catalog page
  
  // 1. Fetch categories
  const categories = await fetchCategories();
  
  // Render filters sidebar
  const categoriesList = document.getElementById("categoriesFilterList");
  if (categoriesList) {
    // Keep the "All" button and append other active categories
    categories.forEach(cat => {
      categoriesList.innerHTML += `
        <li>
          <button class="btn-category-filter" data-category="${cat.name}">
            ${cat.name}
          </button>
        </li>
      `;
    });
    
    // Add Click listeners to category buttons
    document.querySelectorAll(".btn-category-filter").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".btn-category-filter").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        
        activeCategory = e.target.getAttribute("data-category");
        currentPage = 1; // reset page
        
        // Update URL path using history.pushState for smooth UX and SEO URLs
        if (activeCategory === "all") {
          window.history.pushState({}, "", "/products");
          updateSEOHeaders("All Categories");
        } else {
          window.history.pushState({}, "", `/products/${activeCategory.toLowerCase()}`);
          updateSEOHeaders(activeCategory);
        }
        applyFiltersAndRender();
      });
    });
  }
  
  // 2. Load all products
  allCatalogProducts = await fetchProducts();
  
  // 3. Parse URL pathname for category page URLs (e.g. /products/capsules)
  const path = window.location.pathname;
  let urlCategory = null;
  if (path.includes('/products/')) {
    const catSlug = path.split('/products/').pop().split('/').shift().toLowerCase();
    const foundCat = categories.find(c => c.name.toLowerCase() === catSlug);
    if (foundCat) {
      urlCategory = foundCat.name;
    } else {
      urlCategory = catSlug.charAt(0).toUpperCase() + catSlug.slice(1);
    }
  }
  
  // Parse URL query params (fallback)
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get("cat");
  const queryParam = params.get("q");
  
  if (urlCategory) {
    activeCategory = urlCategory;
    updateSEOHeaders(urlCategory);
  } else if (catParam) {
    activeCategory = catParam;
    updateSEOHeaders(catParam);
  } else {
    updateSEOHeaders("All Categories");
  }

  // Mark appropriate category button active in sidebar
  document.querySelectorAll(".btn-category-filter").forEach(btn => {
    if (btn.getAttribute("data-category").toLowerCase() === activeCategory.toLowerCase()) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  if (queryParam) {
    searchQuery = queryParam;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = queryParam;
  }
  
  // 4. Setup sorting dropdown listener
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      activeSort = e.target.value;
      applyFiltersAndRender();
    });
  }
  
  // 5. Setup Reset Button
  const resetBtn = document.getElementById("resetFiltersBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      activeCategory = "all";
      activeSort = "name-asc";
      searchQuery = "";
      currentPage = 1;
      
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = "";
      
      const sortSelect = document.getElementById("sortSelect");
      if (sortSelect) sortSelect.value = "name-asc";
      
      window.history.pushState({}, "", "/products");
      updateSEOHeaders("All Categories");
      
      document.querySelectorAll(".btn-category-filter").forEach(btn => {
        if (btn.getAttribute("data-category") === "all") {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      
      applyFiltersAndRender();
    });
  }
  
  // 6. Setup Pagination listeners (Hidden by default but initialized for safety)
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndRender();
        window.scrollTo({ top: 200, behavior: "smooth" });
      }
    });
    
    nextBtn.addEventListener("click", () => {
      const maxPages = Math.ceil(getFilteredProducts().length / productsPerPage);
      if (currentPage < maxPages) {
        currentPage++;
        applyFiltersAndRender();
        window.scrollTo({ top: 200, behavior: "smooth" });
      }
    });
  }
  
  // 7. Initial render
  applyFiltersAndRender();
}

// Filter matching logic helper
function getFilteredProducts() {
  return allCatalogProducts.filter(p => {
    // Category match (if activeCategory is not 'all', check matches)
    const categoryMatch = activeCategory === "all" || p.category.toLowerCase() === activeCategory.toLowerCase();
    
    // Search query match (Case-insensitive matching Name, Composition, Category)
    const q = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(q);
    const compMatch = p.composition.toLowerCase().includes(q);
    const catMatch = p.category.toLowerCase().includes(q);
    const searchMatch = !searchQuery || nameMatch || compMatch || catMatch;
    
    return categoryMatch && searchMatch;
  });
}

// Core filter, sort, and paginate compiler
function applyFiltersAndRender() {
  const container = document.getElementById("catalogProductsContainer");
  if (!container) return;
  
  // Hide pagination container as we are showing products grouped by category on the single page
  const paginationContainer = document.getElementById("paginationContainer");
  if (paginationContainer) {
    paginationContainer.style.display = "none";
  }
  
  // Get filtered products list
  const filtered = getFilteredProducts();
  
  // Define core categories to prioritize in display order
  const CATEGORY_ORDER = ["Capsules", "Injections", "Syrups", "Tablets", "Veterinary"];
  
  // Find all unique categories represented in the filtered products list
  const representedCategories = [...new Set(filtered.map(p => p.category))];
  
  let categoriesToRender = [];
  if (activeCategory === "all") {
    // Sort categories based on predefined order first, then append any remaining ones
    CATEGORY_ORDER.forEach(cat => {
      const found = representedCategories.find(c => c.toLowerCase() === cat.toLowerCase());
      if (found) {
        categoriesToRender.push(found);
      }
    });
    representedCategories.forEach(cat => {
      if (!categoriesToRender.some(c => c.toLowerCase() === cat.toLowerCase())) {
        categoriesToRender.push(cat);
      }
    });
  } else {
    // Find the matching category with correct case
    const found = representedCategories.find(c => c.toLowerCase() === activeCategory.toLowerCase());
    if (found) {
      categoriesToRender.push(found);
    } else {
      // If not represented in the filtered list but is active category, still add it
      categoriesToRender.push(activeCategory);
    }
  }
  
  let html = "";
  let totalDisplayed = 0;
  
  categoriesToRender.forEach(catName => {
    // Filter matching products in this category
    const productsInCat = filtered.filter(p => p.category.toLowerCase() === catName.toLowerCase());
    
    if (productsInCat.length > 0) {
      // Sort products within category: display_order ASC (where 0 goes last), then name ASC
      productsInCat.sort((a, b) => {
        const orderA = parseInt(a.displayOrder) || 999999;
        const orderB = parseInt(b.displayOrder) || 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Render Category Heading (spans all columns in the grid)
      html += `
        <div class="category-section-header" style="grid-column: 1 / -1; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem;">
          <h3 style="font-size: 1.5rem; color: var(--primary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin: 0;">
            ${catName}
          </h3>
        </div>
      `;
      
      // Render cards
      productsInCat.forEach(p => {
        html += generateProductCardHTML(p);
        totalDisplayed++;
      });
    }
  });
  
  // Counters update
  const totalCountEl = document.getElementById("totalCount");
  const displayedCountEl = document.getElementById("displayedCount");
  if (totalCountEl) totalCountEl.innerText = filtered.length;
  if (displayedCountEl) displayedCountEl.innerText = totalDisplayed;
  
  // Render cards or no match found
  if (totalDisplayed === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
        <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--gray-medium); margin-bottom: 1rem;"></i>
        <h3 style="color: var(--dark);">No formulations found</h3>
        <p style="color: var(--gray-dark); font-size: 0.95rem; margin-top: 0.25rem;">Try modifying your search query or division filters.</p>
      </div>
    `;
    lucide.createIcons();
  } else {
    container.innerHTML = html;
    lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", initCatalog);
