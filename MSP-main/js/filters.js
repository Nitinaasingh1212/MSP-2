// Maa Sukriti Pharmaceuticals - Catalog Filters & Pagination Controller

let activeCategory = "all";
let activeSort = "name-asc";
let searchQuery = "";
let currentPage = 1;
const productsPerPage = 9;

let allCatalogProducts = [];

// Initialize Catalog
async function initCatalog() {
  const container = document.getElementById("catalogProductsContainer");
  if (!container) return; // not on products catalog page
  
  // 1. Fetch categories & render filters sidebar
  const categoriesList = document.getElementById("categoriesFilterList");
  if (categoriesList) {
    const categories = await fetchCategories();
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
        applyFiltersAndRender();
      });
    });
  }
  
  // 2. Load all products
  allCatalogProducts = await fetchProducts();
  
  // 3. Parse URL query params (for link integration e.g. from homepage divisions)
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get("cat");
  const queryParam = params.get("q");
  
  if (catParam) {
    activeCategory = catParam;
    // Mark appropriate category button active
    document.querySelectorAll(".btn-category-filter").forEach(btn => {
      if (btn.getAttribute("data-category") === catParam) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
  
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
  
  // 6. Setup Pagination listeners
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
    // Category match
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
  
  // Filter
  let filtered = getFilteredProducts();
  
  // Sort
  if (activeSort === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (activeSort === "name-desc") {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (activeSort === "newest") {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  // Counters update
  const totalCountEl = document.getElementById("totalCount");
  const displayedCountEl = document.getElementById("displayedCount");
  if (totalCountEl) totalCountEl.innerText = filtered.length;
  
  // Paginate bounds
  const totalItems = filtered.length;
  const maxPages = Math.ceil(totalItems / productsPerPage) || 1;
  
  if (currentPage > maxPages) currentPage = maxPages;
  
  const startIdx = (currentPage - 1) * productsPerPage;
  const endIdx = Math.min(startIdx + productsPerPage, totalItems);
  const paginatedList = filtered.slice(startIdx, endIdx);
  
  if (displayedCountEl) displayedCountEl.innerText = paginatedList.length;
  
  // Pagination UI Update
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const pageNumbers = document.getElementById("pageNumbers");
  
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === maxPages;
  if (pageNumbers) pageNumbers.innerText = `Page ${currentPage} of ${maxPages}`;
  
  // Render cards
  if (paginatedList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">
        <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--gray-medium); margin-bottom: 1rem;"></i>
        <h3 style="color: var(--dark);">No formulations found</h3>
        <p style="color: var(--gray-dark); font-size: 0.95rem; margin-top: 0.25rem;">Try modifying your search query or division filters.</p>
      </div>
    `;
    lucide.createIcons();
  } else {
    container.innerHTML = "";
    paginatedList.forEach(p => {
      container.innerHTML += generateProductCardHTML(p);
    });
    lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", initCatalog);
