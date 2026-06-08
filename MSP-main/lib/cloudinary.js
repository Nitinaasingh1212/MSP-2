const fs = require('fs');
const path = require('path');

function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const folderName = options.folder || 'misc';
      
      // Get file extension from originalname or default
      const originalName = options.originalname || 'file';
      const ext = path.extname(originalName) || (folderName === 'pdfs' ? '.pdf' : '.jpg');
      
      // Generate unique name
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      // 1. Write to local app directory (for development / server fallback)
      const localUploadDir = path.join(__dirname, '../assets/uploads', folderName);
      if (!fs.existsSync(localUploadDir)) {
        fs.mkdirSync(localUploadDir, { recursive: true });
      }
      const localFilePath = path.join(localUploadDir, filename);
      fs.writeFileSync(localFilePath, fileBuffer);

      // 2. Mirror to public web directories if they exist (for Hostinger LiteSpeed static serving)
      const possiblePublicDirs = [
        path.join(__dirname, '../../../../public_html'), // nodejs/MSP-main/lib -> mspharma.in/public_html
        path.join(__dirname, '../../../public_html'),
        path.join(__dirname, '../../public_html'),
        path.join(__dirname, '../public_html'),
        path.join(__dirname, '../../public'),
        path.join(__dirname, '../public')
      ];

      for (const publicDir of possiblePublicDirs) {
        if (fs.existsSync(publicDir)) {
          const publicUploadDir = path.join(publicDir, 'assets/uploads', folderName);
          try {
            if (!fs.existsSync(publicUploadDir)) {
              fs.mkdirSync(publicUploadDir, { recursive: true });
            }
            const publicFilePath = path.join(publicUploadDir, filename);
            fs.writeFileSync(publicFilePath, fileBuffer);
          } catch (mirrorErr) {
            console.error(`Failed to mirror uploaded file to public path (${publicUploadDir}):`, mirrorErr);
          }
        }
      }
      
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
