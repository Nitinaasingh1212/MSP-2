const { getAdminFromRequest } = require('../lib/auth');
const { validateEnv } = require('../lib/env');

module.exports = async (req, res) => {
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in check-auth API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return res.status(401).json({ authenticated: false });
  }
  
  // Disable caching for auth status check
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  return res.status(200).json({ authenticated: true, email: admin.email });
};
