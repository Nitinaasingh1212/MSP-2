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



module.exports = app;
module.exports.config = {
  api: {
    bodyParser: false
  }
};
