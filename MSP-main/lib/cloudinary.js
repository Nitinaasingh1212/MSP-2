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
      let writtenSuccessfully = false;
      const isOnServer = __dirname.includes('/home/u413027252') || fs.existsSync('/home/u413027252/domains/mspharma.in');
      let uploadDir;

      if (isOnServer) {
        // Use external persistent directory on Hostinger server
        uploadDir = path.join(__dirname, '../../uploads', folderName);
      } else {
        // Local fallback for local development
        uploadDir = path.join(__dirname, '../assets/uploads', folderName);
      }

      // Ensure directory exists and write file
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, fileBuffer);
        writtenSuccessfully = true;
      } catch (writeErr) {
        console.error(`Failed to write uploaded file to target directory (${uploadDir}):`, writeErr);
      }

      // Mirror write to the other directory just for double safety if we are on server
      if (isOnServer) {
        const localUploadDir = path.join(__dirname, '../assets/uploads', folderName);
        try {
          if (!fs.existsSync(localUploadDir)) {
            fs.mkdirSync(localUploadDir, { recursive: true });
          }
          const localFilePath = path.join(localUploadDir, filename);
          fs.writeFileSync(localFilePath, fileBuffer);
        } catch (localWriteErr) {
          // Ignore failure to write to the volatile local app folder, as long as the persistent write succeeded
        }
      }

      // If write attempts failed (e.g. complete write permission restriction)
      if (!writtenSuccessfully) {
        throw new Error('Permission Denied: Server filesystem is read-only or doesn\'t permit writing to assets directories.');
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
