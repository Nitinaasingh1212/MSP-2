// Maa Sukriti Pharmaceuticals - Search Controller

// Debounce timer
let searchDebounceTimer = null;

function handleSearchInput(e) {
  const query = e.target.value.trim();
  
  // Clear existing timer
  clearTimeout(searchDebounceTimer);
  
  // Set new timer for debounce (300ms)
  searchDebounceTimer = setTimeout(() => {
    // If on products.html, update searchQuery and filter
    if (window.location.pathname.includes("products.html")) {
      searchQuery = query;
      currentPage = 1; // reset page back to 1
      applyFiltersAndRender();
    }
  }, 300);
}

// Redirect search from homepage (if a search input is ever added to home hero)
function redirectHomeSearch(query) {
  window.location.href = `products.html?q=${encodeURIComponent(query)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
  }
});
