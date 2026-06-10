const db = require('../lib/db');
const { verifyAdmin } = require('../lib/auth');
const { uploadToCloudinary } = require('../lib/cloudinary');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() }).fields([
  { name: 'imageFile', maxCount: 1 },
  { name: 'imageFile1', maxCount: 1 },
  { name: 'imageFile2', maxCount: 1 },
  { name: 'imageFile3', maxCount: 1 },
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

function makeSlug(name) {
  return name.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
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

    const { name, category, composition, packaging, featured, status, description, tags, displayOrder } = req.body;

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

    const images = [];
    
    // Process up to 3 image file uploads
    const imageFilesKeys = ['imageFile', 'imageFile1', 'imageFile2', 'imageFile3'];
    for (const key of imageFilesKeys) {
      if (req.files && req.files[key] && req.files[key][0]) {
        try {
          const imgBuffer = req.files[key][0].buffer;
          const relativeUrl = await uploadToCloudinary(imgBuffer, { 
            folder: 'products',
            originalname: req.files[key][0].originalname
          });
          if (relativeUrl && images.length < 3) {
            images.push(relativeUrl);
          }
        } catch (uploadError) {
          console.error(`Image upload error for ${key}:`, uploadError);
          return res.status(500).json({ error: `Image Upload failed for ${key}: ${uploadError.message}` });
        }
      }
    }

    let pdfUrl = '';
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

    const mainImageUrl = images.length > 0 ? images[0] : '';
    const display_order_val = parseInt(displayOrder) || 0;
    const tags_val = tags ? tags.trim() : '';

    // Auto-generate a unique slug
    const baseSlug = makeSlug(name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const [result] = await db.query(
      `INSERT INTO products (name, category, composition, packaging, featured, status, description, image_url, pdf_url, slug, tags, display_order, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), category.trim(), composition.trim(), packaging.trim(), featured || 'false', status || 'active', description.trim(),
        mainImageUrl, pdfUrl, slug, tags_val, display_order_val, JSON.stringify(images)
      ]
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
