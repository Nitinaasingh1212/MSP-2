const db = require('../lib/db');
const { validateEnv } = require('../lib/env');

module.exports = async (req, res) => {
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in single product API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const r = rows[0];
    const product = {
      id: r.id.toString(),
      name: r.name,
      category: r.category,
      composition: r.composition,
      packaging: r.packaging,
      featured: r.featured === 'true' || r.featured === true,
      status: r.status,
      description: r.description,
      imageUrl: r.image_url,
      pdfUrl: r.pdf_url,
      createdAt: r.created_at
    };

    // Disable caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    return res.status(200).json(product);
  } catch (error) {
    console.error('Fetch product database/API error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
