const db = require('../lib/db');
const { validateEnv } = require('../lib/env');

module.exports = async (req, res) => {
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in add enquiry API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customerName, mobileNumber, city, state, companyName, products, totalItems } = req.body;

  if (!customerName || !mobileNumber || !city || !products || totalItems === undefined) {
    console.error('Validation Error: Required fields are missing for enquiry submission');
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const productsJson = JSON.stringify(products);

    const [result] = await db.query(
      `INSERT INTO enquiries (customer_name, phone, city, state, company_name, products_json, total_items, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerName.trim(), mobileNumber.trim(), city.trim(), (state || '').trim(), (companyName || 'N/A').trim(), productsJson, totalItems, 'New']
    );

    return res.status(200).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Add enquiry database/API error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
