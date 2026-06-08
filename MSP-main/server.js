const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use(require('./api/index'));

// Serve Static Directories
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve Root Level Pages
const pages = [
  { route: '/', file: 'index.html' },
  { route: '/index.html', file: 'index.html' },
  { route: '/products.html', file: 'products.html' },
  { route: '/product-details.html', file: 'product-details.html' },
  { route: '/cart.html', file: 'cart.html' },
  { route: '/about.html', file: 'about.html' },
  { route: '/contact.html', file: 'contact.html' }
];

pages.forEach(p => {
  app.get(p.route, (req, res) => {
    res.sendFile(path.join(__dirname, p.file));
  });
});

// Serve Admin Pages
const adminPages = [
  { route: '/private-control-room/login.html', file: 'private-control-room/login.html' },
  { route: '/private-control-room/dashboard.html', file: 'private-control-room/dashboard.html' },
  { route: '/private-control-room/products.html', file: 'private-control-room/products.html' },
  { route: '/private-control-room/categories.html', file: 'private-control-room/categories.html' },
  { route: '/private-control-room/enquiries.html', file: 'private-control-room/enquiries.html' }
];

adminPages.forEach(p => {
  app.get(p.route, (req, res) => {
    res.sendFile(path.join(__dirname, p.file));
  });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
