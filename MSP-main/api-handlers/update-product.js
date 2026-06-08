const db = require('../lib/db');
const { verifyAdmin } = require('../lib/auth');
const { uploadToCloudinary } = require('../lib/cloudinary');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() }).fields([
  { name: 'imageFile', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]);

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

module.exports = async (req, res) => {
  const { validateEnv } = require('../lib/env');
  try {
    // Validate required environment variables first
    validateEnv();
  } catch (err) {
    console.error('Validation error in update product API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isAdmin = verifyAdmin(req, res);
  if (!isAdmin) return;

  try {
    await runMiddleware(req, res, upload);

    const { id, name, category, composition, packaging, featured, status, description } = req.body;

    // Validate fields before uploading to Cloudinary
    if (!id) {
      console.error('Validation Error: Product ID is missing');
      return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!name || !name.trim()) {
      console.error('Validation Error: Product name is missing');
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!category || !category.trim()) {
      console.error('Validation Error: Product category is missing');
      return res.status(400).json({ error: 'Product category/division is required' });
    }
    if (!composition || !composition.trim()) {
      console.error('Validation Error: Product composition is missing');
      return res.status(400).json({ error: 'Product composition is required' });
    }
    if (!packaging || !packaging.trim()) {
      console.error('Validation Error: Product packaging is missing');
      return res.status(400).json({ error: 'Product packaging is required' });
    }
    if (!description || !description.trim()) {
      console.error('Validation Error: Product description is missing');
      return res.status(400).json({ error: 'Product description is required' });
    }

    const [currentRows] = await db.query('SELECT image_url, pdf_url FROM products WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      console.error(`Validation Error: Product with ID ${id} not found in database`);
      return res.status(404).json({ error: 'Product not found' });
    }

    let imageUrl = currentRows[0].image_url;
    let pdfUrl = currentRows[0].pdf_url;

    // Upload image if present
    if (req.files && req.files.imageFile && req.files.imageFile[0]) {
      try {
        const imgBuffer = req.files.imageFile[0].buffer;
        imageUrl = await uploadToCloudinary(imgBuffer, { 
          folder: 'products',
          originalname: req.files.imageFile[0].originalname
        });
      } catch (uploadError) {
        console.error('Image Upload Error in update API:', uploadError);
        return res.status(500).json({ error: `Image Upload failed: ${uploadError.message}` });
      }
    }

    // Upload brochure if present
    if (req.files && req.files.pdfFile && req.files.pdfFile[0]) {
      try {
        const pdfBuffer = req.files.pdfFile[0].buffer;
        pdfUrl = await uploadToCloudinary(pdfBuffer, { 
          folder: 'pdfs',
          originalname: req.files.pdfFile[0].originalname
        });
      } catch (uploadError) {
        console.error('PDF Upload Error in update API:', uploadError);
        return res.status(500).json({ error: `PDF Upload failed: ${uploadError.message}` });
      }
    }

    await db.query(
      `UPDATE products 
       SET name = ?, category = ?, composition = ?, packaging = ?, featured = ?, status = ?, description = ?, image_url = ?, pdf_url = ?
       WHERE id = ?`,
      [name.trim(), category.trim(), composition.trim(), packaging.trim(), featured || 'false', status || 'active', description.trim(), imageUrl, pdfUrl, id]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update product API database/internal error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
