// Maa Sukriti Pharmaceuticals - Cart State Manager

const CART_STORAGE_KEY = "msp_bharat_cart";

// Load cart items
function getCart() {
  const data = localStorage.getItem(CART_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Cart corrupt, resetting", e);
    return [];
  }
}

// Save cart items
function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
  
  // If on cart page, re-render
  if (document.getElementById("cartItemsList")) {
    renderCartPage();
  }
}

// Add item to cart
function addToCart(productId, name, category, quantity = 10) {
  const cart = getCart();
  const index = cart.findIndex(item => item.productId === productId);
  
  if (index !== -1) {
    cart[index].quantity = parseInt(cart[index].quantity) + parseInt(quantity);
  } else {
    cart.push({ productId, name, category, quantity: parseInt(quantity) });
  }
  
  saveCart(cart);
}

// Remove item from cart
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.productId !== productId);
  saveCart(cart);
  showToastNotification("Item removed from enquiry cart.", "info", "toast-warning");
}

// Update item quantity
function updateCartQuantity(productId, newQty) {
  if (newQty < 1) return;
  const cart = getCart();
  const index = cart.findIndex(item => item.productId === productId);
  if (index !== -1) {
    cart[index].quantity = parseInt(newQty);
    saveCart(cart);
  }
}

// Clear cart
function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartBadge();
}

// Sync header badge
function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) {
    const cart = getCart();
    // Sum unique products or total quantities?
    // Let's sum unique product entries for simplicity, or total quantity.
    // The spec says: "Summary: Total Products, Total Quantity". 
    // Let's make badge show unique items count, e.g. how many lines of medicines.
    badge.innerText = cart.length;
    
    // Animate badge slightly
    if (cart.length > 0) {
      badge.style.transform = "scale(1.2)";
      setTimeout(() => { badge.style.transform = "scale(1)"; }, 200);
    }
  }
}

// Render cart contents in cart.html
function renderCartPage() {
  const container = document.getElementById("cartItemsList");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const summaryTotalItems = document.getElementById("summaryTotalItems");
  const summaryTotalQty = document.getElementById("summaryTotalQty");
  
  if (!container) return;
  
  const cart = getCart();
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 0;">
        <p style="color: var(--gray-dark); margin-bottom: 1.5rem;">Your enquiry cart is empty.</p>
        <a href="products.html" class="btn btn-primary btn-sm">Browse Products</a>
      </div>
    `;
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (summaryTotalItems) summaryTotalItems.innerText = "0";
    if (summaryTotalQty) summaryTotalQty.innerText = "0 Packs";
    return;
  }
  
  if (checkoutBtn) checkoutBtn.disabled = false;
  
  let html = "";
  let totalQty = 0;
  
  cart.forEach(item => {
    totalQty += item.quantity;
    
    // Default image icon fallback
    const imageSvg = `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50" y="55" font-size="28" text-anchor="middle">💊</text></svg>`;
    
    html += `
      <div class="cart-item-row" id="item_${item.productId}">
        <div style="background-color: var(--gray-light); width: 60px; height: 60px; border-radius: var(--radius-sm); overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <img src="${imageSvg}" alt="pharma" style="max-height: 80%; max-width: 80%;">
        </div>
        <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--secondary);">${item.category}</span>
          <h4 style="font-size: 1rem; margin-top: 2px;">${item.name}</h4>
        </div>
        <div class="cart-item-actions-cell" style="display: flex; align-items: center; border: 1.5px solid var(--gray-light); border-radius: var(--radius-sm); overflow: hidden; height: 32px; width: fit-content; background-color: var(--light);">
          <button onclick="changeCartQty('${item.productId}', -10)" style="border: none; background: none; width: 24px; height: 100%; font-weight: 800; cursor: pointer;">-</button>
          <input type="number" value="${item.quantity}" min="1" onchange="updateCartQuantity('${item.productId}', this.value)" style="border: none; width: 44px; text-align: center; font-weight: 700; background: none; font-size: 0.85rem; outline: none;">
          <button onclick="changeCartQty('${item.productId}', 10)" style="border: none; background: none; width: 24px; height: 100%; font-weight: 800; cursor: pointer;">+</button>
        </div>
        <div style="text-align: right;">
          <button onclick="removeFromCart('${item.productId}')" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 0.5rem;" title="Remove Product">
            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  if (summaryTotalItems) summaryTotalItems.innerText = cart.length;
  if (summaryTotalQty) summaryTotalQty.innerText = `${totalQty} Packs`;
  
  lucide.createIcons();
}

// change quantity in Cart helper
function changeCartQty(id, offset) {
  const cart = getCart();
  const item = cart.find(i => i.productId === id);
  if (item) {
    let newQty = parseInt(item.quantity) + offset;
    if (newQty < 1) newQty = 1;
    updateCartQuantity(id, newQty);
  }
}

// Global alert Toast handler
function showToastNotification(msg, icon = "info", type = "toast-success") {
  const toast = document.getElementById("toastBox");
  const toastText = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");
  
  if (toast && toastText && toastIcon) {
    toastText.innerText = msg;
    toastIcon.setAttribute("data-lucide", icon);
    toast.className = `toast-notification show ${type}`;
    lucide.createIcons();
    
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  } else {
    // Basic fallback alert
    alert(msg);
  }
}

// Initialize badge and page on load
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  if (document.getElementById("cartItemsList")) {
    renderCartPage();
  }
});
