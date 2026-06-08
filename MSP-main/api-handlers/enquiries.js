const db = require('../lib/db');
const { verifyAdmin } = require('../lib/auth');
const { validateEnv } = require('../lib/env');

module.exports = async (req, res) => {
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in enquiries API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  const isAdmin = verifyAdmin(req, res);
  if (!isAdmin) return;

  try {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT * FROM enquiries ORDER BY id DESC');
      
      // Disable caching for enquiries GET list
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      const enquiries = rows.map(r => ({
        id: r.id.toString(),
        customerName: r.customer_name,
        mobileNumber: r.phone,
        city: r.city,
        state: r.state,
        companyName: r.company_name,
        products: JSON.parse(r.products_json || '[]'),
        totalItems: r.total_items,
        status: r.status,
        createdAt: r.created_at
      }));

      return res.status(200).json(enquiries);
    } 
    
    if (req.method === 'PUT' || (req.method === 'POST' && req.query.action === 'update')) {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status are required' });
      }

      await db.query('UPDATE enquiries SET status = ? WHERE id = ?', [status, id]);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE' || (req.method === 'POST' && req.query.action === 'delete')) {
      const id = req.query.id || req.body.id;
      if (!id) {
        return res.status(400).json({ error: 'Enquiry ID is required' });
      }

      await db.query('DELETE FROM enquiries WHERE id = ?', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Enquiries management error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
