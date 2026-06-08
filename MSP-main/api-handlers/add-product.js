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
    console.error('Validation error in add product API:', err.message);
    return res.status(500).json({ error: err.message });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isAdmin = verifyAdmin(req, res);
  if (!isAdmin) return;

  try {
    await runMiddleware(req, res, upload);

    const { name, category, composition, packaging, featured, status, description } = req.body;

    // Validate fields before uploading to Cloudinary
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

    let imageUrl = '';
    let pdfUrl = '';

    // Upload image if present
    if (req.files && req.files.imageFile && req.files.imageFile[0]) {
      try {
        const imgBuffer = req.files.imageFile[0].buffer;
        imageUrl = await uploadToCloudinary(imgBuffer, { 
          folder: 'products',
          originalname: req.files.imageFile[0].originalname
        });
      } catch (uploadError) {
        console.error('Image Upload Error:', uploadError);
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
        console.error('PDF Upload Error:', uploadError);
        return res.status(500).json({ error: `PDF Upload failed: ${uploadError.message}` });
      }
    }

    const [result] = await db.query(
      `INSERT INTO products (name, category, composition, packaging, featured, status, description, image_url, pdf_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), category.trim(), composition.trim(), packaging.trim(), featured || 'false', status || 'active', description.trim(), imageUrl, pdfUrl]
    );

    return res.status(200).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Add product API database/internal error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
