const db = require('../lib/db');
const { validateEnv } = require('../lib/env');

module.exports = async (req, res) => {
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in products API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const showAll = req.query.all === 'true';

  try {
    let query = 'SELECT * FROM products';
    let params = [];
    if (!showAll) {
      query += ' WHERE status = ?';
      params.push('active');
    }
    query += ' ORDER BY display_order ASC, name ASC, id ASC';

    const [rows] = await db.query(query, params);
    
    const products = rows.map(r => ({
      id: r.id.toString(),
      name: r.name,
      category: r.category,
      composition: r.composition,
      packaging: r.packaging,
      featured: r.featured === 'true' || r.featured === true,
      status: r.status,
      description: r.description,
      imageUrl: r.image_url ? (r.image_url.startsWith('http') || r.image_url.startsWith('/') ? r.image_url : `/assets/uploads/products/${r.image_url}`) : '',
      pdfUrl: r.pdf_url ? (r.pdf_url.startsWith('http') || r.pdf_url.startsWith('/') ? r.pdf_url : `/assets/uploads/pdfs/${r.pdf_url}`) : '',
      slug: r.slug || '',
      tags: r.tags || '',
      displayOrder: r.display_order || 0,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
      createdAt: r.created_at
    }));

    // Disable caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    return res.status(200).json(products);
  } catch (error) {
    console.error('Fetch products database/API error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
