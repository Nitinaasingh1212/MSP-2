const fs = require('fs');
const path = require('path');

function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const folderName = options.folder || 'misc';
      
      // Define path relative to this file: ../assets/uploads/products or ../assets/uploads/pdfs
      const uploadDir = path.join(__dirname, '../assets/uploads', folderName);
      
      // Ensure folder exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Get file extension from originalname or default
      const originalName = options.originalname || 'file';
      const ext = path.extname(originalName) || (folderName === 'pdfs' ? '.pdf' : '.jpg');
      
      // Generate unique name
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      // Write buffer to disk
      fs.writeFileSync(filePath, fileBuffer);
      
      // Return relative web URL
      const relativeUrl = `/assets/uploads/${folderName}/${filename}`;
      resolve(relativeUrl);
    } catch (err) {
      console.error('Local file write error:', err);
      reject(err);
    }
  });
}

module.exports = {
  uploadToCloudinary
};
