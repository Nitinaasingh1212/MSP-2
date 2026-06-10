// Maa Sukriti Pharmaceuticals - Admin Dashboard Controllers & CRUD Operations

// Global state trackers
let currentEditingProductId = null;
let currentViewingEnquiryId = null;

// Ensure toast notification is defined for all admin pages
if (typeof showToastNotification === 'undefined') {
  window.showToastNotification = function(msg, icon = "info", type = "toast-success") {
    const toast = document.getElementById("toastBox");
    const toastText = document.getElementById("toastMsg");
    const toastIcon = document.getElementById("toastIcon");
    
    if (toast && toastText && toastIcon) {
      toastText.innerText = msg;
      toastIcon.setAttribute("data-lucide", icon);
      toast.className = `toast-notification show ${type}`;
      if (window.lucide) {
        lucide.createIcons();
      }
      
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    } else {
      alert(msg);
    }
  };
}

// Display connection status on load
function updateDBConnectionBadge() {
  const badge = document.getElementById("dbModeBadge");
  if (!badge) return;
  
  fetch("/api/check-auth")
    .then(async res => {
      if (res.status === 200 || res.status === 401) {
        badge.innerText = "MySQL Connected";
        badge.style.backgroundColor = "var(--success-light)";
        badge.style.color = "var(--success-dark)";
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error();
        }
      }
    })
    .catch((err) => {
      const errMsg = err && err.message ? err.message : "DEMO Mode (Local Storage)";
      badge.innerText = errMsg.includes("Configuration Error") ? errMsg : "DEMO Mode (Local Storage)";
      badge.style.backgroundColor = "var(--warning-light)";
      badge.style.color = "var(--warning-dark)";
      console.warn("Database connection badge warning:", errMsg);
    });
}

// Fetch all enquiries
async function fetchEnquiries() {
  try {
    const res = await fetch("/api/enquiries");
    if (!res.ok) throw new Error("Failed to load enquiries");
    return await res.json();
  } catch (e) {
    console.error("Enquiries API load error: ", e);
    // Local fallback
    const stored = localStorage.getItem("mock_enquiries");
    if (!stored) return [];
    return JSON.parse(stored).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

// 1. DASHBOARD OVERVIEW ENGINE
async function initDashboard() {
  if (!window.location.pathname.includes("dashboard")) return;
  
  updateDBConnectionBadge();
  
  const products = await fetchProducts();
  const categories = await fetchCategories();
  const enquiries = await fetchEnquiries();
  
  // Counters
  document.getElementById("statTotalProducts").innerText = products.length;
  document.getElementById("statTotalCategories").innerText = categories.length;
  document.getElementById("statTotalEnquiries").innerText = enquiries.length;
  
  let totalQty = 0;
  enquiries.forEach(e => {
    totalQty += parseInt(e.totalItems) || 0;
  });
  document.getElementById("statTotalQty").innerText = totalQty;
  
  // Load Table
  const tableBody = document.getElementById("recentEnquiriesTableBody");
  if (enquiries.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--gray-dark);">No customer enquiries registered yet.</td></tr>`;
  } else {
    tableBody.innerHTML = "";
    enquiries.slice(0, 5).forEach(e => {
      const formattedDate = new Date(e.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
      const badgeClass = e.status === "New" ? "badge-new" : e.status === "Contacted" ? "badge-contacted" : "badge-closed";
      
      tableBody.innerHTML += `
        <tr>
          <td>
            <div style="font-weight:700;">${e.customerName}</div>
            <div style="font-size:0.8rem; color:var(--gray-dark);">${e.companyName}</div>
          </td>
          <td>${e.city}, ${e.state}</td>
          <td><span style="font-weight:600; color:var(--primary-dark);">${e.totalItems} Packs</span></td>
          <td style="font-size:0.85rem;">${formattedDate}</td>
          <td><span class="badge ${badgeClass}">${e.status}</span></td>
          <td>
            <button onclick="window.location.href='enquiries.html?id=${e.id}'" class="btn-action" title="View Details">
              <i data-lucide="eye" style="width:16px; height:16px;"></i>
            </button>
          </td>
        </tr>
      `;
    });
    lucide.createIcons();
  }
  
  // Render Charts
  renderDashboardCharts(products, categories, enquiries);
}

function renderDashboardCharts(products, categories, enquiries) {
  // Chart 1: Monthly Enquiries Trend (Last 6 Months)
  const monthlyCanvas = document.getElementById("monthlyEnquiriesChart");
  if (monthlyCanvas) {
    const monthlyData = {};
    const months = [];
    
    // Generate last 6 months keys
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      months.push(key);
      monthlyData[key] = 0;
    }
    
    enquiries.forEach(e => {
      const date = new Date(e.createdAt);
      const key = date.toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthlyData[key] !== undefined) {
        monthlyData[key]++;
      }
    });
    
    new Chart(monthlyCanvas, {
      type: "bar",
      data: {
        labels: months,
        datasets: [{
          label: "Enquiries Submitted",
          data: months.map(m => monthlyData[m]),
          backgroundColor: "#0d9488",
          borderRadius: 6,
          hoverBackgroundColor: "#0f766e"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
          x: { grid: { display: false } }
        }
      }
    });
  }
  
  // Chart 2: Division Share (Product Breakdown)
  const breakdownCanvas = document.getElementById("categoryBreakdownChart");
  if (breakdownCanvas) {
    const catCounts = {};
    categories.forEach(c => {
      catCounts[c.name] = 0;
    });
    
    products.forEach(p => {
      if (catCounts[p.category] !== undefined) {
        catCounts[p.category]++;
      } else {
        catCounts[p.category] = 1;
      }
    });
    
    const labels = Object.keys(catCounts).filter(k => catCounts[k] > 0);
    const data = labels.map(l => catCounts[l]);
    
    new Chart(breakdownCanvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ["#0d9488", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { boxWidth: 12, font: { family: "Plus Jakarta Sans" } } }
        }
      }
    });
  }
}

// 2. PRODUCT MANAGEMENT CRUD ENGINE
async function initProductsManager() {
  if (!window.location.pathname.includes("manage-products")) return;
  
  updateDBConnectionBadge();
  
  // Populate category lists and select drop downs
  await loadAdminCategorySelects();
  
  // Load products list
  await loadAdminProductsTable();
  
  // Listen to search triggers
  const searchInput = document.getElementById("adminSearchInput");
  const catSelect = document.getElementById("adminCategorySelect");
  
  if (searchInput) searchInput.addEventListener("input", loadAdminProductsTable);
  if (catSelect) catSelect.addEventListener("change", loadAdminProductsTable);
}

async function loadAdminCategorySelects() {
  const cats = await fetchCategories();
  const filterSelect = document.getElementById("adminCategorySelect");
  const formSelect = document.getElementById("formCategory");
  
  if (filterSelect) {
    filterSelect.innerHTML = `<option value="all">All Divisions</option>`;
    cats.forEach(c => {
      filterSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
  }
  
  if (formSelect) {
    formSelect.innerHTML = `<option value="" disabled selected>Select Category</option>`;
    cats.forEach(c => {
      formSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
  }
}

async function loadAdminProductsTable() {
  const tableBody = document.getElementById("adminProductsTableBody");
  if (!tableBody) return;
  
  const allProds = await fetchProducts(true);
  const q = (document.getElementById("adminSearchInput")?.value || "").toLowerCase().trim();
  const cat = document.getElementById("adminCategorySelect")?.value || "all";
  
  // Filter products client-side for admin view list
  const filtered = allProds.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(q) || p.composition.toLowerCase().includes(q);
    const matchesCat = cat === "all" || p.category === cat;
    return matchesSearch && matchesCat;
  });
  
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--gray-dark);">No products matched the current filters.</td></tr>`;
    return;
  }
  
  tableBody.innerHTML = "";
  filtered.forEach(p => {
    const isFeatured = (p.featured === true || p.featured === "true") ? "Yes" : "No";
    const statusBadge = p.status === "active" ? `<span class="badge badge-active">Active</span>` : `<span class="badge badge-hidden">Hidden</span>`;
    
    // image preview
    const validImg = (p.imageUrl && p.imageUrl.trim() !== '' && !p.imageUrl.toLowerCase().endsWith('/') && !p.imageUrl.toLowerCase().includes('undefined') && !p.imageUrl.toLowerCase().includes('null')) ? p.imageUrl : '';
    const imageTd = validImg 
      ? `<img src="${validImg}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">` 
      : `<span style="font-size:1.5rem;">💊</span>`;
      
    tableBody.innerHTML += `
      <tr>
        <td>${imageTd}</td>
        <td><div style="font-weight:700;">${p.name}</div></td>
        <td><span style="font-weight:600; color:var(--secondary);">${p.category}</span></td>
        <td style="font-family:monospace; font-size:0.85rem;">${p.composition}</td>
        <td><span style="font-size:0.85rem; color:var(--gray-dark);">${p.tags || '-'}</span></td>
        <td><span style="font-weight:600;">${p.displayOrder || 0}</span></td>
        <td>${isFeatured}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="action-btns">
            <button onclick="openProductModal('edit', '${p.id}')" class="btn-action" title="Edit Product">
              <i data-lucide="edit-3" style="width:16px; height:16px;"></i>
            </button>
            <button onclick="deleteProduct('${p.id}')" class="btn-action btn-action-delete" title="Delete Product">
              <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  lucide.createIcons();
}

let activeExistingImages = [];

function renderActiveExistingImages() {
  const container = document.getElementById("existingImagesContainer");
  const list = document.getElementById("existingImagesList");
  if (!container || !list) return;
  
  if (activeExistingImages.length === 0) {
    container.style.display = "none";
    list.innerHTML = "";
    return;
  }
  
  container.style.display = "block";
  list.innerHTML = "";
  activeExistingImages.forEach((img, idx) => {
    list.innerHTML += `
      <div class="existing-image-thumb" style="position: relative; width: 60px; height: 60px; border: 1px solid var(--gray-medium); border-radius: 4px; overflow: hidden; background-color: white;">
        <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
        <button type="button" onclick="removeExistingImage(${idx})" style="position: absolute; top: 0; right: 0; background: rgba(239, 68, 68, 0.8); color: white; border: none; cursor: pointer; padding: 2px 5px; font-size: 0.75rem; border-bottom-left-radius: 4px; line-height: 1;">&times;</button>
      </div>
    `;
  });
}

function removeExistingImage(index) {
  activeExistingImages.splice(index, 1);
  renderActiveExistingImages();
}

function openProductModal(mode, prodId = null) {
  const modal = document.getElementById("productModal");
  const form = document.getElementById("productForm");
  const title = document.getElementById("modalTitle");
  
  form.reset();
  
  // Clear file input previews
  const previews = ["imgPreview1", "imgPreview2", "imgPreview3", "pdfPreview"];
  previews.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";
      el.innerText = "";
    }
  });

  const files = ["formImageFile1", "formImageFile2", "formImageFile3", "formPdfFile"];
  files.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // Clear tags and order
  const tagsInput = document.getElementById("formTags");
  if (tagsInput) tagsInput.value = "";
  
  const orderInput = document.getElementById("formDisplayOrder");
  if (orderInput) orderInput.value = "0";

  // Reset mini upload boxes background style
  document.querySelectorAll('.file-upload-box-mini').forEach(box => {
    box.style.backgroundImage = 'none';
    const svg = box.querySelector('svg');
    const p = box.querySelector('p');
    if (svg) svg.style.opacity = '1';
    if (p) p.style.opacity = '1';
  });

  activeExistingImages = [];
  renderActiveExistingImages();
  currentEditingProductId = null;
  
  if (mode === "add") {
    title.innerText = "Add Formulation";
    document.getElementById("formProductId").value = "";
  } else if (mode === "edit" && prodId) {
    title.innerText = "Edit Formulation";
    currentEditingProductId = prodId;
    document.getElementById("formProductId").value = prodId;
    
    // Fetch details and prefill
    fetchProductById(prodId).then(p => {
      if (p) {
        document.getElementById("formName").value = p.name;
        document.getElementById("formCategory").value = p.category;
        document.getElementById("formComposition").value = p.composition;
        document.getElementById("formPackaging").value = p.packaging;
        document.getElementById("formFeatured").checked = (p.featured === true || p.featured === "true");
        document.getElementById("formStatus").checked = (p.status === "active");
        document.getElementById("formDescription").value = p.description;
        
        if (tagsInput) tagsInput.value = p.tags || "";
        if (orderInput) orderInput.value = p.displayOrder || 0;
        
        activeExistingImages = p.images || (p.imageUrl ? [p.imageUrl] : []);
        renderActiveExistingImages();

        if (p.pdfUrl) {
          const pdfP = document.getElementById("pdfPreview");
          if (pdfP) {
            pdfP.innerText = "Current PDF Brochure active";
            pdfP.style.display = "block";
          }
        }
      }
    });
  }
  
  modal.style.display = "flex";
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
}

async function saveProduct(event) {
  event.preventDefault();
  
  const id = document.getElementById("formProductId").value;
  const name = document.getElementById("formName").value.trim();
  const category = document.getElementById("formCategory").value;
  const composition = document.getElementById("formComposition").value.trim();
  const packaging = document.getElementById("formPackaging").value.trim();
  const featured = document.getElementById("formFeatured").checked;
  const active = document.getElementById("formStatus").checked;
  const status = active ? "active" : "hidden";
  const description = document.getElementById("formDescription").value.trim();
  
  const tags = document.getElementById("formTags")?.value.trim() || "";
  const displayOrder = document.getElementById("formDisplayOrder")?.value || "0";

  const imageFile1 = document.getElementById("formImageFile1")?.files[0];
  const imageFile2 = document.getElementById("formImageFile2")?.files[0];
  const imageFile3 = document.getElementById("formImageFile3")?.files[0];
  const pdfFile = document.getElementById("formPdfFile")?.files[0];

  // Client-side Validation BEFORE uploading files to Cloudinary
  if (!name) {
    showToastNotification("Product Name is required.", "alert-triangle", "toast-error");
    return;
  }
  if (!category) {
    showToastNotification("Division / Category is required.", "alert-triangle", "toast-error");
    return;
  }
  if (!composition) {
    showToastNotification("Composition Formula is required.", "alert-triangle", "toast-error");
    return;
  }
  if (!packaging) {
    showToastNotification("Packaging specs are required.", "alert-triangle", "toast-error");
    return;
  }
  if (!description) {
    showToastNotification("Description is required.", "alert-triangle", "toast-error");
    return;
  }
  
  const btn = document.getElementById("saveProductBtn");
  btn.disabled = true;
  btn.innerText = "Saving Formulation...";
  
  // 1. Build FormData
  const formData = new FormData();
  if (id) formData.append("id", id);
  formData.append("name", name);
  formData.append("category", category);
  formData.append("composition", composition);
  formData.append("packaging", packaging);
  formData.append("featured", featured ? "true" : "false");
  formData.append("status", status);
  formData.append("description", description);
  formData.append("tags", tags);
  formData.append("displayOrder", displayOrder);

  // Send references to active existing images
  formData.append("existingImage1", activeExistingImages[0] || "");
  formData.append("existingImage2", activeExistingImages[1] || "");
  formData.append("existingImage3", activeExistingImages[2] || "");
  
  if (imageFile1) formData.append("imageFile1", imageFile1);
  if (imageFile2) formData.append("imageFile2", imageFile2);
  if (imageFile3) formData.append("imageFile3", imageFile3);
  if (pdfFile) formData.append("pdfFile", pdfFile);

  let dbSuccess = false;
  let isDemoMode = false;
  try {
    const url = id ? "/api/update-product" : "/api/add-product";
    const res = await fetch(url, {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      dbSuccess = true;
      const successMsg = id ? "Product Updated Successfully" : "Product Added Successfully";
      showToastNotification(successMsg, "check-circle", "toast-success");
    } else {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || "Save failed";
      showToastNotification(errMsg, "alert-triangle", "toast-error");
      isDemoMode = false; // Real API responded with an error, do not write to local storage
    }
  } catch (error) {
    console.error("Save product API error:", error);
    // Network / server connection error suggests we might be running in offline demo mode
    isDemoMode = true;
  }

  if (!dbSuccess && isDemoMode) {
    // Local storage mock updates fallback
    const local = getLocalProducts();
    
    // Construct new images array from existing and uploaded files
    let images = [...activeExistingImages];
    if (imageFile1) images[0] = URL.createObjectURL(imageFile1);
    if (imageFile2) images[1] = URL.createObjectURL(imageFile2);
    if (imageFile3) images[2] = URL.createObjectURL(imageFile3);
    images = images.filter(Boolean);

    let imageUrl = images.length > 0 ? images[0] : "";
    let pdfUrl = "";
    if (id) {
      const existing = local.find(p => p.id === id);
      if (existing) {
        pdfUrl = existing.pdfUrl || "";
      }
    }
    if (pdfFile) pdfUrl = URL.createObjectURL(pdfFile);

    const newProductDoc = {
      name,
      category,
      composition,
      packaging,
      featured,
      status,
      description,
      imageUrl,
      pdfUrl,
      tags,
      displayOrder: parseInt(displayOrder) || 0,
      images,
      createdAt: new Date().toISOString()
    };

    if (id) {
      const idx = local.findIndex(p => p.id === id);
      if (idx !== -1) {
        local[idx] = { ...local[idx], ...newProductDoc, id };
      }
    } else {
      newProductDoc.id = "p_" + Date.now();
      local.push(newProductDoc);
    }
    localStorage.setItem("local_products", JSON.stringify(local));
    showToastNotification("Demo Mode: Formulation saved locally.", "check-circle", "toast-success");
  }

  btn.disabled = false;
  btn.innerText = "Save Formulation";
  closeProductModal();
  loadAdminProductsTable();
}

async function deleteProduct(prodId) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  let dbSuccess = false;
  let isDemoMode = false;
  try {
    const res = await fetch(`/api/delete-product?id=${prodId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      dbSuccess = true;
      showToastNotification("Product Deleted Successfully", "check-circle", "toast-success");
    } else {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || "Delete failed";
      showToastNotification(errMsg, "alert-triangle", "toast-error");
      isDemoMode = false;
    }
  } catch (error) {
    console.error("Delete API error:", error);
    isDemoMode = true;
  }

  if (!dbSuccess && isDemoMode) {
    let local = getLocalProducts();
    local = local.filter(p => p.id !== prodId);
    localStorage.setItem("local_products", JSON.stringify(local));
    showToastNotification("Demo Mode: Product deleted locally.", "check-circle", "toast-success");
  }
  
  loadAdminProductsTable();
}

// 3. CATEGORY MANAGEMENT CRUD ENGINE
async function initCategoriesManager() {
  if (!window.location.pathname.includes("categories")) return;
  
  updateDBConnectionBadge();
  
  await loadAdminCategoriesTable();
}

async function loadAdminCategoriesTable() {
  const tableBody = document.getElementById("adminCategoriesTableBody");
  if (!tableBody) return;
  
  const cats = await fetchCategories();
  
  if (cats.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--gray-dark);">No division categories registered.</td></tr>`;
    return;
  }
  
  tableBody.innerHTML = "";
  cats.forEach(c => {
    const badge = c.status === "active" ? `<span class="badge badge-active">Active</span>` : `<span class="badge badge-hidden">Hidden</span>`;
    
    tableBody.innerHTML += `
      <tr>
        <td><div style="font-weight:700; font-size:1.05rem;">${c.name}</div></td>
        <td>${badge}</td>
        <td>
          <div class="action-btns">
            <button onclick="editCategoryForm('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${c.status}')" class="btn-action" title="Edit Category">
              <i data-lucide="edit-3" style="width:16px; height:16px;"></i>
            </button>
            <button onclick="deleteCategory('${c.id}')" class="btn-action btn-action-delete" title="Delete Category">
              <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  lucide.createIcons();
}

function editCategoryForm(id, name, status) {
  document.getElementById("categoryFormTitle").innerText = "Edit Division";
  document.getElementById("formCategoryId").value = id;
  document.getElementById("categoryName").value = name;
  document.getElementById("categoryStatus").checked = (status === "active");
}

function resetCategoryForm() {
  document.getElementById("categoryFormTitle").innerText = "Add Division";
  document.getElementById("formCategoryId").value = "";
  document.getElementById("categoryForm").reset();
}

async function saveCategory(event) {
  event.preventDefault();
  
  const id = document.getElementById("formCategoryId").value;
  const name = document.getElementById("categoryName").value.trim();
  const active = document.getElementById("categoryStatus").checked;
  const status = active ? "active" : "hidden";
  
  const btn = document.getElementById("saveCategoryBtn");
  btn.disabled = true;
  btn.innerText = "Saving...";
  
  const newCat = { name, status };
  if (id) newCat.id = id;
  
  let dbSuccess = false;
  try {
    const method = id ? "PUT" : "POST";
    const res = await fetch("/api/categories", {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat)
    });

    if (res.ok) {
      dbSuccess = true;
      showToastNotification("Division saved successfully!", "check-circle", "toast-success");
    } else {
      const errData = await res.json();
      throw new Error(errData.error || "Save failed");
    }
  } catch (error) {
    console.error("Save category API error:", error);
  }

  if (!dbSuccess) {
    // Local storage mock fallback
    const local = getLocalCategories();
    if (id) {
      const idx = local.findIndex(c => c.id === id);
      if (idx !== -1) {
        local[idx] = { ...local[idx], ...newCat, id };
      }
    } else {
      newCat.id = "cat_" + Date.now();
      local.push(newCat);
    }
    localStorage.setItem("local_categories", JSON.stringify(local));
    showToastNotification("Demo Mode: Category saved locally.", "check-circle", "toast-success");
  }
  
  btn.disabled = false;
  btn.innerText = "Save Division";
  resetCategoryForm();
  loadAdminCategoriesTable();
}

async function deleteCategory(catId) {
  if (!confirm("Are you sure you want to delete this category? Products mapped to this category may no longer display correctly.")) return;
  
  let dbSuccess = false;
  try {
    const res = await fetch(`/api/categories?id=${catId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      dbSuccess = true;
      showToastNotification("Category deleted.", "check-circle", "toast-success");
    }
  } catch (e) {
    console.error("Delete category API error:", e);
  }

  if (!dbSuccess) {
    let local = getLocalCategories();
    local = local.filter(c => c.id !== catId);
    localStorage.setItem("local_categories", JSON.stringify(local));
    showToastNotification("Demo Mode: Category deleted locally.", "check-circle", "toast-success");
  }
  
  loadAdminCategoriesTable();
}

// 4. ENQUIRIES VIEW & DETAILS ENGINE
let allFetchedEnquiries = [];

async function initEnquiriesManager() {
  if (!window.location.pathname.includes("enquiries")) return;
  
  updateDBConnectionBadge();
  
  await loadAdminEnquiriesTable();
  
  // Search and status select filters
  const searchEl = document.getElementById("enquirySearchInput");
  const statusEl = document.getElementById("enquiryStatusSelect");
  
  if (searchEl) searchEl.addEventListener("input", loadAdminEnquiriesTable);
  if (statusEl) statusEl.addEventListener("change", loadAdminEnquiriesTable);
  
  // URL details check
  const params = new URLSearchParams(window.location.search);
  const checkId = params.get("id");
  if (checkId) {
    setTimeout(() => {
      openEnquiryDetailModal(checkId);
    }, 500);
  }
}

async function loadAdminEnquiriesTable() {
  const tableBody = document.getElementById("adminEnquiriesTableBody");
  if (!tableBody) return;
  
  allFetchedEnquiries = await fetchEnquiries();
  
  const q = (document.getElementById("enquirySearchInput")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("enquiryStatusSelect")?.value || "all";
  
  const filtered = allFetchedEnquiries.filter(e => {
    const matchesSearch = e.customerName.toLowerCase().includes(q) || e.mobileNumber.includes(q);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--gray-dark);">No customer enquiries match this filter.</td></tr>`;
    return;
  }
  
  tableBody.innerHTML = "";
  filtered.forEach(e => {
    const dateFormatted = new Date(e.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    
    const badgeClass = e.status === "New" ? "badge-new" : e.status === "Contacted" ? "badge-contacted" : "badge-closed";
    
    tableBody.innerHTML += `
      <tr>
        <td><div style="font-weight:700;">${e.customerName}</div></td>
        <td>
          <div style="font-weight:600; color:var(--primary-dark); font-size:0.85rem;">+91 ${e.mobileNumber}</div>
          <div style="font-size:0.8rem; color:var(--gray-dark);">${e.companyName}</div>
        </td>
        <td>${e.city}, ${e.state}</td>
        <td><span style="font-weight:600;">${e.totalItems} Packs</span></td>
        <td style="font-size:0.85rem;">${dateFormatted}</td>
        <td><span class="badge ${badgeClass}">${e.status}</span></td>
        <td>
          <div class="action-btns">
            <button onclick="openEnquiryDetailModal('${e.id}')" class="btn-action" title="View Enquiry Details">
              <i data-lucide="eye" style="width:16px; height:16px;"></i>
            </button>
            <button onclick="deleteEnquiry('${e.id}')" class="btn-action btn-action-delete" title="Delete Records">
              <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  lucide.createIcons();
}

async function openEnquiryDetailModal(enqId) {
  currentViewingEnquiryId = enqId;
  const modal = document.getElementById("enquiryDetailModal");
  
  // Find enquiry
  let enq = allFetchedEnquiries.find(e => e.id === enqId);
  if (!enq) {
    // backup query from fetch
    const list = await fetchEnquiries();
    enq = list.find(e => e.id === enqId);
  }
  
  if (!enq) {
    showToastNotification("Error loading enquiry details.", "alert-triangle", "toast-error");
    return;
  }
  
  // Prefill details
  document.getElementById("detCustName").innerText = enq.customerName;
  document.getElementById("detCustCompany").innerText = `Company: ${enq.companyName}`;
  document.getElementById("detCustMobile").innerText = `WhatsApp: +91 ${enq.mobileNumber}`;
  document.getElementById("detCustLocation").innerText = `Location: ${enq.city}, ${enq.state}`;
  
  const dateFormatted = new Date(enq.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
  document.getElementById("detEnquiryDate").innerText = `Date: ${dateFormatted}`;
  document.getElementById("detEnquiryStatus").value = enq.status;
  
  // Fill products list table
  const pTable = document.getElementById("detProductsTableBody");
  pTable.innerHTML = "";
  
  if (enq.products && enq.products.length > 0) {
    enq.products.forEach(p => {
      pTable.innerHTML += `
        <tr style="border-bottom: 1px solid var(--gray-light);">
          <td style="padding: 0.5rem var(--spacing-sm); color:var(--gray-dark); font-size:0.8rem;">${p.category || "General"}</td>
          <td style="padding: 0.5rem var(--spacing-sm); font-weight:600;">${p.name}</td>
          <td style="padding: 0.5rem var(--spacing-sm); text-align:right; font-weight:700; color:var(--primary-dark);">${p.quantity} Packs</td>
        </tr>
      `;
    });
  } else {
    // Direct message / contact form case
    pTable.innerHTML = `
      <tr>
        <td colspan="3" style="padding: 1rem; color:var(--gray-dark); text-align:center;">
          Direct Contact message: ${enq.products && enq.products[0] ? enq.products[0].composition : "No items listed."}
        </td>
      </tr>
    `;
  }
  
  // Direct WhatsApp Reply generator link
  const repMsg = `Hello ${enq.customerName},\n\nWe received your enquiry (ID: ${enq.id}) submitted on our website regarding the requested formulations. We are ready to process your quotation. Let's discuss details.`;
  document.getElementById("detDirectWhatsAppCall").href = `https://wa.me/91${enq.mobileNumber}?text=${encodeURIComponent(repMsg)}`;
  
  modal.style.display = "flex";
}

function closeEnquiryDetailModal() {
  document.getElementById("enquiryDetailModal").style.display = "none";
}

async function updateModalEnquiryStatus(newStatus) {
  if (!currentViewingEnquiryId) return;
  
  let dbSuccess = false;
  try {
    const res = await fetch("/api/enquiries", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: currentViewingEnquiryId, status: newStatus })
    });
    if (res.ok) {
      dbSuccess = true;
      showToastNotification("Enquiry status updated successfully.", "check-circle", "toast-success");
    }
  } catch (e) {
    console.error("Update enquiry status API error:", e);
  }
  
  if (!dbSuccess) {
    // Local mock update
    const mock = JSON.parse(localStorage.getItem("mock_enquiries") || "[]");
    const idx = mock.findIndex(e => e.id === currentViewingEnquiryId);
    if (idx !== -1) {
      mock[idx].status = newStatus;
      localStorage.setItem("mock_enquiries", JSON.stringify(mock));
      showToastNotification("Demo Mode: Status updated locally.", "check-circle", "toast-success");
    }
  }
  
  // Reload
  if (window.location.pathname.includes("dashboard")) {
    initDashboard();
  } else {
    loadAdminEnquiriesTable();
  }
}

async function deleteEnquiry(enqId) {
  if (!confirm("Are you sure you want to delete this enquiry record? This cannot be undone.")) return;
  
  let dbSuccess = false;
  try {
    const res = await fetch(`/api/enquiries?id=${enqId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      dbSuccess = true;
      showToastNotification("Enquiry deleted successfully.", "check-circle", "toast-success");
    }
  } catch (e) {
    console.error("Delete enquiry API error:", e);
  }
  
  if (!dbSuccess) {
    let mock = JSON.parse(localStorage.getItem("mock_enquiries") || "[]");
    mock = mock.filter(e => e.id !== enqId);
    localStorage.setItem("mock_enquiries", JSON.stringify(mock));
    showToastNotification("Demo Mode: Enquiry deleted locally.", "check-circle", "toast-success");
  }
  
  loadAdminEnquiriesTable();
}

function triggerProductsImport() {
  if (confirm("Are you sure you want to scrape and import products from mspbharat.com? This may take up to a minute, and will overwrite details/images for any products with duplicate names.")) {
    window.open("/api/import-products", "_blank");
  }
}

// Global router initialization for page actions
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  if (path.includes("dashboard")) {
    initDashboard();
  } else if (path.includes("manage-products")) {
    initProductsManager();
  } else if (path.includes("categories")) {
    initCategoriesManager();
  } else if (path.includes("enquiries")) {
    initEnquiriesManager();
  }
});
