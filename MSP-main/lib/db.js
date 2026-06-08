const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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

async function initDB() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      // 0. Quick check to see if database is already initialized (saves 7+ queries)
      try {
        await pool.query('SELECT 1 FROM products LIMIT 1');
        initialized = true;
        return;
      } catch (err) {
        console.log('Database tables not found, running initialization/seeding...');
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

          for (const p of defaultProds) {
            await conn.query(
              `INSERT INTO products (name, category, composition, packaging, featured, status, description, image_url, pdf_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [p.name, p.category, p.composition, p.packaging, p.featured, p.status, p.description, p.imageUrl, p.pdfUrl]
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
