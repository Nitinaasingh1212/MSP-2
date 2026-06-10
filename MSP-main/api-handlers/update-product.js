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

    const { id, name, category, composition, packaging, featured, status, description, tags, displayOrder, existingImage1, existingImage2, existingImage3 } = req.body;

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

    const [currentRows] = await db.query('SELECT name, slug, image_url, pdf_url, images FROM products WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      console.error(`Validation Error: Product with ID ${id} not found in database`);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Process gallery images
    const existingImages = [
      existingImage1 || '',
      existingImage2 || '',
      existingImage3 || ''
    ];

    let img1 = existingImages[0];
    if (req.files && ((req.files.imageFile && req.files.imageFile[0]) || (req.files.imageFile1 && req.files.imageFile1[0]))) {
      const file = (req.files.imageFile && req.files.imageFile[0]) || (req.files.imageFile1 && req.files.imageFile1[0]);
      try {
        const imgBuffer = file.buffer;
        img1 = await uploadToCloudinary(imgBuffer, { 
          folder: 'products',
          originalname: file.originalname
        });
      } catch (uploadError) {
        console.error('Image upload error for slot 1:', uploadError);
        return res.status(500).json({ error: `Image Upload failed for slot 1: ${uploadError.message}` });
      }
    }

    let img2 = existingImages[1];
    if (req.files && req.files.imageFile2 && req.files.imageFile2[0]) {
      const file = req.files.imageFile2[0];
      try {
        const imgBuffer = file.buffer;
        img2 = await uploadToCloudinary(imgBuffer, { 
          folder: 'products',
          originalname: file.originalname
        });
      } catch (uploadError) {
        console.error('Image upload error for slot 2:', uploadError);
        return res.status(500).json({ error: `Image Upload failed for slot 2: ${uploadError.message}` });
      }
    }

    let img3 = existingImages[2];
    if (req.files && req.files.imageFile3 && req.files.imageFile3[0]) {
      const file = req.files.imageFile3[0];
      try {
        const imgBuffer = file.buffer;
        img3 = await uploadToCloudinary(imgBuffer, { 
          folder: 'products',
          originalname: file.originalname
        });
      } catch (uploadError) {
        console.error('Image upload error for slot 3:', uploadError);
        return res.status(500).json({ error: `Image Upload failed for slot 3: ${uploadError.message}` });
      }
    }

    const imagesList = [img1, img2, img3].filter(url => url && url.trim() !== '');
    const imageUrl = imagesList.length > 0 ? imagesList[0] : '';

    let pdfUrl = currentRows[0].pdf_url;
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

    // Update slug if product name changes
    let slug = currentRows[0].slug;
    if (name.trim() !== currentRows[0].name) {
      const baseSlug = makeSlug(name);
      slug = baseSlug;
      let counter = 1;
      while (true) {
        const [existing] = await db.query('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, id]);
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const display_order_val = parseInt(displayOrder) || 0;
    const tags_val = tags ? tags.trim() : '';

    await db.query(
      `UPDATE products 
       SET name = ?, category = ?, composition = ?, packaging = ?, featured = ?, status = ?, description = ?, image_url = ?, pdf_url = ?, slug = ?, tags = ?, display_order = ?, images = ?
       WHERE id = ?`,
      [
        name.trim(), category.trim(), composition.trim(), packaging.trim(), featured || 'false', status || 'active', description.trim(),
        imageUrl, pdfUrl, slug, tags_val, display_order_val, JSON.stringify(imagesList), id
      ]
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
