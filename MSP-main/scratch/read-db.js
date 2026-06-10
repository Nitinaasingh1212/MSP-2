const db = require('./lib/db');

async function checkProducts() {
  try {
    const [rows] = await db.query('SELECT id, name, image_url, images FROM products ORDER BY id DESC LIMIT 5');
    console.log("LAST 5 PRODUCTS IN DATABASE:");
    rows.forEach(r => {
      console.log(`ID: ${r.id}`);
      console.log(`Name: ${r.name}`);
      console.log(`Image URL: ${r.image_url}`);
      console.log(`Images JSON: ${r.images}`);
      console.log("------------------------");
    });
    process.exit(0);
  } catch (err) {
    console.error("Error querying database:", err);
    process.exit(1);
  }
}

checkProducts();
