const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// Parse request bodies and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route incoming API calls to their respective handlers
app.get('/api/products', require('../api-handlers/products'));
app.get('/api/product', require('../api-handlers/product'));
app.post('/api/add-product', require('../api-handlers/add-product'));
app.post('/api/update-product', require('../api-handlers/update-product'));
app.put('/api/update-product', require('../api-handlers/update-product'));
app.delete('/api/delete-product', require('../api-handlers/delete-product'));

app.post('/api/add-enquiry', require('../api-handlers/add-enquiry'));
app.get('/api/enquiries', require('../api-handlers/enquiries'));
app.put('/api/enquiries', require('../api-handlers/enquiries'));
app.delete('/api/enquiries', require('../api-handlers/enquiries'));

app.get('/api/categories', require('../api-handlers/categories'));
app.post('/api/categories', require('../api-handlers/categories'));
app.put('/api/categories', require('../api-handlers/categories'));
app.delete('/api/categories', require('../api-handlers/categories'));

app.post('/api/login', require('../api-handlers/login'));
app.post('/api/logout', require('../api-handlers/logout'));
app.get('/api/check-auth', require('../api-handlers/check-auth'));
app.get('/api/import-products', require('../api-handlers/import-products'));

app.get('/api/debug-paths', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const debugInfo = {
    __dirname,
    cwd: process.cwd(),
    publicHtmlContents: [],
    assetsContents: [],
    uploadsContents: []
  };

  // 1. Scan public_html contents
  const publicHtml = path.join(__dirname, '../../public_html');
  try {
    if (fs.existsSync(publicHtml)) {
      debugInfo.publicHtmlContents = fs.readdirSync(publicHtml);
    } else {
      debugInfo.publicHtmlContents = ['public_html does not exist at ' + publicHtml];
    }
  } catch (e) {
    debugInfo.publicHtmlContents = ['Error public_html: ' + e.message];
  }

  // 2. Scan nodejs/assets contents
  const assets = path.join(__dirname, '../assets');
  try {
    if (fs.existsSync(assets)) {
      debugInfo.assetsContents = fs.readdirSync(assets);
    } else {
      debugInfo.assetsContents = ['assets does not exist at ' + assets];
    }
  } catch (e) {
    debugInfo.assetsContents = ['Error assets: ' + e.message];
  }

  // 3. Scan for any directory named 'uploads' or 'products' in parent folders
  const parentOfNode = path.join(__dirname, '../..');
  try {
    debugInfo.uploadsContents = fs.readdirSync(parentOfNode).filter(f => {
      try {
        return fs.statSync(path.join(parentOfNode, f)).isDirectory();
      } catch(e) { return false; }
    });
  } catch (e) {
    debugInfo.uploadsContents = ['Error parent: ' + e.message];
  }

  // 4. Read logs
  const consoleLogPath = path.join(__dirname, '../console.log');
  const stderrLogPath = path.join(__dirname, '../stderr.log');
  try {
    if (fs.existsSync(consoleLogPath)) {
      debugInfo.consoleLog = fs.readFileSync(consoleLogPath, 'utf8').split('\n').slice(-50).join('\n');
    }
    if (fs.existsSync(stderrLogPath)) {
      debugInfo.stderrLog = fs.readFileSync(stderrLogPath, 'utf8').split('\n').slice(-50).join('\n');
    }
  } catch (e) {
    debugInfo.logsError = e.message;
  }

  // Test writing and directory creation to /home/u413027252/domains/mspharma.in/uploads
  try {
    const testDir = '/home/u413027252/domains/mspharma.in/uploads/products';
    fs.mkdirSync(testDir, { recursive: true });
    const testFilePath = path.join(testDir, 'test_write.txt');
    fs.writeFileSync(testFilePath, 'Write test successful at ' + new Date().toISOString());
    
    debugInfo.publicWriteResult = 'SUCCESS: Created ' + testDir + ' and wrote test_write.txt';
    debugInfo.publicReadBack = fs.readFileSync(testFilePath, 'utf8');
    debugInfo.publicHtmlContentsAfter = fs.readdirSync('/home/u413027252/domains/mspharma.in');
    
    // Inspect DO_NOT_UPLOAD_HERE
    const warnPath = '/home/u413027252/domains/mspharma.in/DO_NOT_UPLOAD_HERE';
    if (fs.existsSync(warnPath)) {
      try {
        const stat = fs.statSync(warnPath);
        if (stat.isFile()) {
          debugInfo.warnContent = fs.readFileSync(warnPath, 'utf8');
        } else {
          debugInfo.warnContent = 'Directory contents: ' + JSON.stringify(fs.readdirSync(warnPath));
        }
      } catch (e) {
        debugInfo.warnContent = 'Error reading: ' + e.message;
      }
    } else {
      debugInfo.warnContent = 'Does not exist';
    }
    
    // Read live cloudinary.js content
    const cloudinaryPath = path.join(__dirname, '../lib/cloudinary.js');
    if (fs.existsSync(cloudinaryPath)) {
      debugInfo.cloudinaryJs = fs.readFileSync(cloudinaryPath, 'utf8');
    } else {
      debugInfo.cloudinaryJs = 'Does not exist at ' + cloudinaryPath;
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
  } catch (err) {
    debugInfo.publicWriteResult = 'FAILED: ' + err.message;
  }

  res.json(debugInfo);
});

app.get('/api/debug-find-files', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const searchRoot = '/home/u413027252/domains/mspharma.in';
  const found = [];
  
  function scan(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            // Avoid recursion into node_modules
            if (item !== 'node_modules' && item !== '.git') {
              scan(full);
            }
          } else {
            if (item.includes('1781107658474') || item.includes('1781107957266') || item.includes('1781107658475')) {
              found.push({
                name: item,
                path: full,
                size: stat.size
              });
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
  }
  
  scan(searchRoot);
  res.json({ searchRoot, found });
});

module.exports = app;
module.exports.config = {
  api: {
    bodyParser: false
  }
};
