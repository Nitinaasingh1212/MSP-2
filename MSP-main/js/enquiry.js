// Maa Sukriti Pharmaceuticals - Enquiry Checkout & WhatsApp Redirect System

// Target WhatsApp Mobile Number (e.g. 919415021041)
const TARGET_WHATSAPP_NUMBER = "919415021041";

async function handleCartCheckout(event) {
  event.preventDefault();
  
  const name = document.getElementById("custName").value.trim();
  const mobile = document.getElementById("custMobile").value.trim();
  const city = document.getElementById("custCity").value.trim();
  const state = document.getElementById("custState").value.trim();
  const company = document.getElementById("custCompany").value.trim() || "N/A";
  
  const cart = getCart();
  if (cart.length === 0) {
    showToastNotification("Your cart is empty.", "alert-triangle", "toast-error");
    return;
  }
  
  // Calculate counts
  let totalQty = 0;
  cart.forEach(item => totalQty += parseInt(item.quantity));
  
  // Create enquiry object matching Database Scheme
  const enquiryData = {
    customerName: name,
    mobileNumber: mobile,
    city: city,
    state: state,
    companyName: company,
    products: cart.map(i => ({
      productId: i.productId,
      name: i.name,
      category: i.category,
      quantity: i.quantity
    })),
    totalItems: totalQty,
    status: "New", // New, Contacted, Closed
    createdAt: new Date().toISOString()
  };
  
  let dbSuccess = false;
  let newEnquiryId = "enq_" + Date.now();
  
  // Disable checkout button to prevent double submits
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerText = "Processing Enquiry...";
  }
  
  // 1. Store in Database
  try {
    const res = await fetch("/api/add-enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enquiryData)
    });
    if (res.ok) {
      const data = await res.json();
      newEnquiryId = data.id.toString();
      dbSuccess = true;
      console.log("Enquiry saved to MySQL: ", newEnquiryId);
    } else {
      console.error("Failed to save enquiry to MySQL");
    }
  } catch (error) {
    console.error("Enquiry save API error: ", error);
  }
  
  if (!dbSuccess) {
    // Demo Mode Local Storage save fallback
    const mockEnquiries = JSON.parse(localStorage.getItem("mock_enquiries") || "[]");
    enquiryData.id = newEnquiryId;
    mockEnquiries.push(enquiryData);
    localStorage.setItem("mock_enquiries", JSON.stringify(mockEnquiries));
    console.log("Demo Mode: Enquiry saved to local storage: ", newEnquiryId);
  }
  
  // 2. Generate WhatsApp message
  let messageText = `Hello Maa Sukriti Pharmaceuticals,\n\nI am interested in the following products:\n\n`;
  cart.forEach((item, index) => {
    messageText += `${index + 1}. ${item.name} - ${item.quantity} Packs\n`;
  });
  
  messageText += `\nCustomer Details:\n\n`;
  messageText += `Name: ${name}\n`;
  messageText += `Mobile: ${mobile}\n`;
  messageText += `City: ${city}\n`;
  messageText += `State: ${state}\n`;
  messageText += `Company: ${company}\n\n`;
  messageText += `Please contact me.`;
  
  // 3. Clear Cart
  clearCart();
  
  // 4. Notify and Redirect
  showToastNotification("Enquiry Saved! Opening WhatsApp...", "check-circle", "toast-success");
  
  setTimeout(() => {
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${TARGET_WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.location.href = whatsappUrl;
  }, 1200);
}
