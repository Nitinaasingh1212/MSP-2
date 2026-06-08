const db = require('../lib/db');
const { verifyAdmin } = require('../lib/auth');
const { validateEnv } = require('../lib/env');

module.exports = async (req, res) => {
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in delete product API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  // Support DELETE and POST (some shared hosting environments restrict DELETE requests)
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isAdmin = verifyAdmin(req, res);
  if (!isAdmin) return;

  const id = req.query.id || req.body.id;
  if (!id) {
    console.error('Delete product validation error: Product ID is missing');
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      console.error(`Delete product error: Product with ID ${id} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete product database/API error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
