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

app.get('/api/debug-paths', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const debugInfo = {
    __dirname,
    cwd: process.cwd(),
    parentDirs: []
  };

  let current = __dirname;
  for (let i = 0; i < 5; i++) {
    current = path.dirname(current);
    try {
      debugInfo.parentDirs.push({
        path: current,
        contents: fs.readdirSync(current).map(f => {
          try {
            const stats = fs.statSync(path.join(current, f));
            return `${f} (${stats.isDirectory() ? 'dir' : 'file'})`;
          } catch (statErr) {
            return `${f} (unknown)`;
          }
        })
      });
    } catch (e) {
      debugInfo.parentDirs.push({
        path: current,
        error: e.message
      });
    }
  }

  res.json(debugInfo);
});

module.exports = app;
module.exports.config = {
  api: {
    bodyParser: false
  }
};
