const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'msp-super-secret-key-12345';

function getAdminFromRequest(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/admin_session=([^;]+)/);
  if (!match) return null;
  
  const token = match[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // contains { email, id }
  } catch (error) {
    return null;
  }
}

function verifyAdmin(req, res) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: 'Unauthorized: Admin session required' });
    return false;
  }
  return admin;
}

module.exports = {
  JWT_SECRET,
  getAdminFromRequest,
  verifyAdmin
};
