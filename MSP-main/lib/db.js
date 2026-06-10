const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const host = process.env.TIDB_HOST || process.env.DB_HOST;
const port = parseInt(process.env.TIDB_PORT || process.env.DB_PORT || (process.env.TIDB_HOST ? '4000' : '3306'));
const user = process.env.TIDB_USER || process.env.DB_USER;
const password = process.env.TIDB_PASSWORD || process.env.DB_PASSWORD;
const database = process.env.TIDB_DATABASE || process.env.DB_NAME;

const poolConfig = {
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const useSSL = process.env.DB_SSL === 'true' || 
                process.env.TIDB_HOST || 
                (host && !host.includes('localhost') && !host.includes('127.0.0.1'));

if (useSSL) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool(poolConfig);

let initialized = false;
let initPromise = null;

function generateSlug(name) {
  return name.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')   // replace spaces and underscores with hyphens
    .replace(/-+/g, '-');      // remove duplicate hyphens
}

async function initDB() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      // 0. Quick check to see if database tables exist. If they do, run schema check and migrations.
      let tablesExist = false;
      try {
        await pool.query('SELECT 1 FROM products LIMIT 1');
        tablesExist = true;
      } catch (err) {
        console.log('Database tables not found, running initialization/seeding...');
      }

      if (tablesExist) {
        // Run column migrations & data upgrades on existing tables
        try {
          const [columns] = await pool.query('SHOW COLUMNS FROM products');
          const columnNames = columns.map(c => c.Field);
          
          if (!columnNames.includes('slug')) {
            console.log('Migration: Adding slug column to products table...');
            await pool.query('ALTER TABLE products ADD COLUMN slug VARCHAR(255) UNIQUE');
          }
          if (!columnNames.includes('tags')) {
            console.log('Migration: Adding tags column to products table...');
            await pool.query('ALTER TABLE products ADD COLUMN tags VARCHAR(1000) DEFAULT ""');
          }
          if (!columnNames.includes('display_order')) {
            console.log('Migration: Adding display_order column to products table...');
            await pool.query('ALTER TABLE products ADD COLUMN display_order INT DEFAULT 0');
          }
          if (!columnNames.includes('images')) {
            console.log('Migration: Adding images column to products table...');
            await pool.query('ALTER TABLE products ADD COLUMN images JSON');
          }

          // Data migrations: update null/empty slugs, images, display_order
          const [rows] = await pool.query('SELECT id, name, image_url, slug, display_order, images FROM products');
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let needsUpdate = false;
            let updateSql = 'UPDATE products SET ';
            let updateParams = [];
            
            if (!row.slug) {
              const baseSlug = generateSlug(row.name);
              // Make baseSlug unique
              let uniqueSlug = baseSlug;
              let counter = 1;
              while (true) {
                const [existing] = await pool.query('SELECT id FROM products WHERE slug = ? AND id != ?', [uniqueSlug, row.id]);
                if (existing.length === 0) break;
                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
              }
              updateSql += 'slug = ?, ';
              updateParams.push(uniqueSlug);
              needsUpdate = true;
            }
            
            if (row.display_order === null || row.display_order === 0) {
              updateSql += 'display_order = ?, ';
              updateParams.push(i + 1);
              needsUpdate = true;
            }
            
            if (!row.images) {
              const defaultImagesArray = row.image_url ? [row.image_url] : [];
              updateSql += 'images = ?, ';
              updateParams.push(JSON.stringify(defaultImagesArray));
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              updateSql = updateSql.slice(0, -2) + ' WHERE id = ?';
              updateParams.push(row.id);
              await pool.query(updateSql, updateParams);
            }
          }
          console.log('Database schema and data migrations completed successfully.');
        } catch (migrationErr) {
          console.error('Failed to run database migrations:', migrationErr);
        }
        initialized = true;
        return;
      }

      const conn = await pool.getConnection();
      try {
        // 1. Create categories table
        await conn.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 2. Create products table
        await conn.query(`
          CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(255) NOT NULL,
            composition VARCHAR(255) NOT NULL,
            packaging VARCHAR(255) NOT NULL,
            featured VARCHAR(10) DEFAULT 'false',
            status VARCHAR(50) DEFAULT 'active',
            description TEXT NOT NULL,
            image_url TEXT NOT NULL,
            pdf_url TEXT,
            slug VARCHAR(255) UNIQUE,
            tags VARCHAR(1000) DEFAULT '',
            display_order INT DEFAULT 0,
            images JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 3. Create enquiries table
        await conn.query(`
          CREATE TABLE IF NOT EXISTS enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(255),
            phone VARCHAR(30),
            city VARCHAR(255),
            state VARCHAR(255),
            company_name VARCHAR(255),
            products_json LONGTEXT,
            total_items INT,
            status VARCHAR(50) DEFAULT 'New',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 4. Create admins table
        await conn.query(`
          CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            password_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 5. Seed default admin if none exist
        const [admins] = await conn.query('SELECT COUNT(*) as count FROM admins');
        if (admins[0].count === 0) {
          const defaultEmail = 'admin@mspbharat.com';
          const hash = await bcrypt.hash('admin123', 10);
          await conn.query('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [defaultEmail, hash]);
          console.log('Seeded default administrator.');
        }

        // 6. Seed default categories if none exist
        const [categories] = await conn.query('SELECT COUNT(*) as count FROM categories');
        if (categories[0].count === 0) {
          const defaultCats = ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Ayurvedic', 'Veterinary'];
          for (const cat of defaultCats) {
            await conn.query('INSERT INTO categories (name, status) VALUES (?, ?)', [cat, 'active']);
          }
          console.log('Seeded default categories.');
        }

        // 7. Seed default products if none exist
        const [products] = await conn.query('SELECT COUNT(*) as count FROM products');
        if (products[0].count === 0) {
          const defaultProds = [
            {
              name: "Paracetamol 650mg Tablets",
              category: "Tablets",
              composition: "Paracetamol IP 650mg",
              description: "Effective antipyretic and analgesic formulation. Indicated for fast relief from high fever, body pain, headache, and minor muscular aches.",
              packaging: "10 x 10 Blister Pack",
              imageUrl: "",
              pdfUrl: "",
              featured: "true",
              status: "active"
            },
            {
              name: "Amoxicillin 500mg Capsules",
              category: "Capsules",
              composition: "Amoxicillin Trihydrate IP 500mg",
              description: "Broad-spectrum penicillin antibiotic used to treat bacterial infections of the ear, nose, throat, urinary tract, and respiratory tract.",
              packaging: "10 x 10 Blister Pack",
              imageUrl: "",
              pdfUrl: "",
              featured: "true",
              status: "active"
            },
            {
              name: "Pantoprazole 40mg Tablets",
              category: "Tablets",
              composition: "Pantoprazole Sodium IP 40mg",
              description: "Proton pump inhibitor (PPI) that decreases the amount of acid produced in the stomach. Prescribed for GERD, acid reflux, and peptic ulcers.",
              packaging: "10 x 10 Alu-Alu Pack",
              imageUrl: "",
              pdfUrl: "",
              featured: "true",
              status: "active"
            },
            {
              name: "Cough & Cold Liquid Oral",
              category: "Syrups",
              composition: "Dextromethorphan HBr 10mg + Phenylephrine HCl 5mg + Chlorpheniramine Maleate 2mg per 5ml",
              description: "Advanced non-drowsy formulation for quick symptomatic relief from dry cough, nasal congestion, throat irritation, and sneezing.",
              packaging: "100 ml Pet Bottle",
              imageUrl: "",
              pdfUrl: "",
              featured: "false",
              status: "active"
            },
            {
              name: "Multivitamin & Antioxidant Softgels",
              category: "Capsules",
              composition: "Ginseng + Ginkgo Biloba + Green Tea Extract + Multivitamins + Minerals",
              description: "Premium daily health supplement designed to boost immunity, improve cognitive performance, and reduce oxidative stress.",
              packaging: "3 x 10 Blister Pack",
              imageUrl: "",
              pdfUrl: "",
              featured: "true",
              status: "active"
            },
            {
              name: "Ceftriaxone 1g Injection",
              category: "Injections",
              composition: "Ceftriaxone Sodium IP 1g",
              description: "Sterile cephalosporin antibiotic injection. Prescribed for severe bacterial infections including meningitis, sepsis, and surgical prophylaxis.",
              packaging: "Single Vial with WFI (Water for Injection)",
              imageUrl: "",
              pdfUrl: "",
              featured: "true",
              status: "active"
            },
            {
              name: "B-Complex with L-Lysine Syrup",
              category: "Syrups",
              composition: "Thiamine 2mg + Riboflavin 2mg + Niacinamide 15mg + L-Lysine 100mg per 5ml",
              description: "Essential vitamin B formulation enriched with amino acids. Promotes metabolic health, increases appetite, and treats nutritional deficiencies.",
              packaging: "200 ml Bottle",
              imageUrl: "",
              pdfUrl: "",
              featured: "true",
              status: "active"
            },
            {
              name: "Pure Ashwagandha Extract Capsules",
              category: "Ayurvedic",
              composition: "Withania Somnifera (Ashwagandha) Root Extract 500mg",
              description: "Natural adaptogenic supplement. Helps reduce stress and anxiety, enhances muscle strength, boosts cognitive focus, and improves general energy.",
              packaging: "60 Veggie Capsules Bottle",
              imageUrl: "",
              pdfUrl: "",
              featured: "false",
              status: "active"
            },
            {
              name: "Tulsi & Honey Herbal Cough Remedy",
              category: "Ayurvedic",
              composition: "Ocimum Sanctum (Tulsi) + Adhatoda Vasica (Vasaka) + Honey base",
              description: "Pure Ayurvedic cough syrup. Relieves chest congestion, liquefies sputum, and soothes dry throat without drowsiness side effects.",
              packaging: "100 ml Pet Bottle",
              imageUrl: "",
              pdfUrl: "",
              featured: "true",
              status: "active"
            }
          ];

          for (let i = 0; i < defaultProds.length; i++) {
            const p = defaultProds[i];
            const baseSlug = generateSlug(p.name);
            const defaultImagesArray = p.imageUrl ? [p.imageUrl] : [];
            await conn.query(
              `INSERT INTO products (name, category, composition, packaging, featured, status, description, image_url, pdf_url, slug, tags, display_order, images)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                p.name, p.category, p.composition, p.packaging, p.featured, p.status, p.description, p.imageUrl, p.pdfUrl,
                baseSlug, '', i + 1, JSON.stringify(defaultImagesArray)
              ]
            );
          }
          console.log('Seeded default products.');
        }

        initialized = true;
      } catch (err) {
        console.error('Database initialization failed:', err);
        initPromise = null; // reset to allow retries on subsequent requests
      } finally {
        conn.release();
      }
    })();
  }
  return initPromise;
}

module.exports = {
  query: async (sql, params) => {
    await initDB();
    return pool.query(sql, params);
  },
  execute: async (sql, params) => {
    await initDB();
    return pool.execute(sql, params);
  },
  pool
};
