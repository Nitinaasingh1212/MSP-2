// Firebase Configuration for Maa Sukriti Pharmaceuticals - Migrated to MySQL
// This file is kept to maintain structural compatibility with the HTML files,
// but client-side Firebase calls are deactivated in favor of serverless MySQL APIs.

const isFirebaseConfigured = false;
const db = null;
const auth = null;
const storage = null;

// Global helper returning inactive Firebase status. 
// Frontend code has been modified to use /api/* endpoints.
function getFirebaseStatus() {
  return {
    configured: false,
    db: null,
    auth: null,
    storage: null
  };
}
