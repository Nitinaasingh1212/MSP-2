// Maa Sukriti Pharmaceuticals - Admin Panel Authentication & Route Protection

// Default Demo Mode credentials
const MOCK_ADMIN_EMAIL = "admin@mspbharat.com";
const MOCK_ADMIN_PASSWORD = "admin123";

// Admin state check
async function checkAdminAuth() {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes("login.html");
  
  try {
    const res = await fetch("/api/check-auth");
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        if (isLoginPage) {
          window.location.href = "dashboard.html";
        }
        return;
      }
    }
  } catch (e) {
    console.error("Auth check API error: ", e);
  }
  
  // Fallback to Demo Mode check for local testing
  const mockSession = sessionStorage.getItem("mock_admin_session");
  if (mockSession === "true") {
    if (isLoginPage) {
      window.location.href = "dashboard.html";
    }
  } else {
    if (!isLoginPage) {
      window.location.href = "login.html";
    }
  }
}

// Login execution
async function handleAdminLogin(email, password) {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      window.location.href = "dashboard.html";
      return;
    }
    
    const errData = await res.json();
    throw new Error(errData.error || "Invalid credentials.");
  } catch (e) {
    console.error("Login API error: ", e);
    
    // Fallback to Mock Auth
    if (email.toLowerCase() === MOCK_ADMIN_EMAIL && password === MOCK_ADMIN_PASSWORD) {
      sessionStorage.setItem("mock_admin_session", "true");
      window.location.href = "dashboard.html";
    } else {
      throw new Error(e.message || "Invalid admin email or password. Use demo details: admin@mspbharat.com / admin123");
    }
  }
}

// Log out execution
async function handleAdminLogout() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (e) {
    console.error("Logout API error: ", e);
  }
  sessionStorage.removeItem("mock_admin_session");
  window.location.href = "login.html";
}

// Show error messages
function showAuthError(msg) {
  const errBox = document.getElementById("loginErrorMsg");
  if (errBox) {
    errBox.innerText = msg;
    errBox.style.display = "block";
  } else {
    alert(msg);
  }
}

// Run auth check automatically on script load for admin pages
document.addEventListener("DOMContentLoaded", () => {
  // Check if we are inside the secret admin area
  const path = window.location.pathname;
  if (path.includes("private-control-room")) {
    checkAdminAuth();
  }
});
