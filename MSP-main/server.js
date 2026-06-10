const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

// 301 Redirect Legacy Pages to Clean URLs
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/products.html', (req, res) => res.redirect(301, '/products'));
app.get('/about.html', (req, res) => res.redirect(301, '/about'));
app.get('/contact.html', (req, res) => res.redirect(301, '/contact'));
app.get('/cart.html', (req, res) => res.redirect(301, '/cart'));

// 301 Redirect Legacy Product Details to SEO Slug URLs
app.get(['/product-details.html', '/product-details'], async (req, res) => {
  const { id } = req.query;
  if (id) {
    try {
      const db = require('./lib/db');
      const [rows] = await db.query('SELECT slug FROM products WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].slug) {
        return res.redirect(301, `/product/${rows[0].slug}`);
      }
    } catch (err) {
      console.error('Redirect query error:', err);
    }
  }
  res.redirect(301, '/products');
});

// 301 Redirect Legacy Admin Panel Routes to New hidden admin route
app.get('/private-control-room', (req, res) => {
  res.redirect(301, '/admin-control');
});
app.get('/private-control-room/:page*', (req, res) => {
  const page = req.params.page || '';
  const rest = req.params[0] || '';
  res.redirect(301, `/admin-control/${page}${rest}`);
});

// Serve Root Level Clean URLs
const cleanPages = [
  { routes: ['/', '/index'], file: 'index.html' },
  { routes: ['/products'], file: 'products.html' },
  { routes: ['/about'], file: 'about.html' },
  { routes: ['/contact'], file: 'contact.html' },
  { routes: ['/cart'], file: 'cart.html' },
  { routes: ['/robots.txt'], file: 'robots.txt' }
];

cleanPages.forEach(p => {
  p.routes.forEach(r => {
    app.get(r, (req, res) => {
      res.sendFile(path.join(__dirname, p.file));
    });
  });
});

// Dynamic XML Sitemap Generator Route
app.get('/sitemap.xml', async (req, res) => {
  try {
    const db = require('./lib/db');
    const [rows] = await db.query('SELECT slug FROM products WHERE status = ?', ['active']);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mspharma.in/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://mspharma.in/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://mspharma.in/products</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mspharma.in/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://mspharma.in/cart</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    rows.forEach(p => {
      if (p.slug) {
        xml += `
  <url>
    <loc>https://mspharma.in/product/${p.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    });

    xml += `\n</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// Serve Dynamic SEO Product Details page
app.get('/product/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'product-details.html'));
});

// Serve Dynamic SEO Product Category page
app.get('/products/:category', (req, res, next) => {
  const allowedCategories = ['capsules', 'injections', 'syrups', 'tablets', 'veterinary'];
  if (allowedCategories.includes(req.params.category.toLowerCase())) {
    res.sendFile(path.join(__dirname, 'products.html'));
  } else {
    next();
  }
});

// 301 Redirect Admin Pages with .html to Clean URLs
app.get('/admin-control/:page.html', (req, res) => {
  res.redirect(301, `/admin-control/${req.params.page}`);
});

// Serve Admin Pages (Clean routes)
const adminPages = [
  { routes: ['/admin-control', '/admin-control/', '/admin-control/dashboard'], file: 'private-control-room/dashboard.html' },
  { routes: ['/admin-control/login'], file: 'private-control-room/login.html' },
  { routes: ['/admin-control/manage-products'], file: 'private-control-room/manage-products.html' },
  { routes: ['/admin-control/categories'], file: 'private-control-room/categories.html' },
  { routes: ['/admin-control/enquiries'], file: 'private-control-room/enquiries.html' }
];

adminPages.forEach(p => {
  p.routes.forEach(r => {
    app.get(r, (req, res) => {
      res.sendFile(path.join(__dirname, p.file));
    });
  });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
