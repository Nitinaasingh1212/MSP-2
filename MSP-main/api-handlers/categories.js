const db = require('../lib/db');
const { verifyAdmin } = require('../lib/auth');
const { validateEnv } = require('../lib/env');

module.exports = async (req, res) => {
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in categories API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  try {
    if (req.method === 'GET') {
      const showAll = req.query.all === 'true';
      let query = 'SELECT * FROM categories';
      let params = [];
      
      if (!showAll) {
        query += ' WHERE status = ?';
        params.push('active');
      }
      query += ' ORDER BY name ASC';

      const [rows] = await db.query(query, params);

      // Disable caching for categories list
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      const categories = rows.map(r => ({
        id: r.id.toString(),
        name: r.name,
        status: r.status
      }));

      return res.status(200).json(categories);
    }

    const isAdmin = verifyAdmin(req, res);
    if (!isAdmin) return;

    if (req.method === 'POST') {
      const { name, status } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const [result] = await db.query(
        'INSERT INTO categories (name, status) VALUES (?, ?)',
        [name, status || 'active']
      );

      return res.status(200).json({ success: true, id: result.insertId });
    }

    if (req.method === 'PUT' || (req.method === 'POST' && req.query.action === 'update')) {
      const { id, name, status } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: 'ID and name are required' });
      }

      await db.query(
        'UPDATE categories SET name = ?, status = ? WHERE id = ?',
        [name, status || 'active', id]
      );

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE' || (req.method === 'POST' && req.query.action === 'delete')) {
      const id = req.query.id || req.body.id;
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }

      await db.query('DELETE FROM categories WHERE id = ?', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Categories API error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
