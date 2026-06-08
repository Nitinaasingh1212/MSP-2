const { validateEnv } = require('./lib/env');
const db = require('./lib/db');

async function testConnection() {
  console.log("1. Validating environment variables...");
  try {
    validateEnv();
    console.log("   [OK] Environment variables are valid.");
  } catch (err) {
    console.error("   [ERROR] Environment verification failed:", err.message);
    console.log("\nMake sure you have created your .env file and populated the values.");
    process.exit(1);
  }

  console.log("\n2. Attempting database connection & checking tables...");
  try {
    const start = Date.now();
    // Querying triggers initDB() in lib/db.js to auto-create and seed tables
    await db.query('SELECT 1');
    console.log(`   [OK] Connected successfully! Tables initialized in ${Date.now() - start}ms.`);
    
    const [tables] = await db.query('SHOW TABLES');
    console.log("\n3. Current Tables inside your Database:");
    if (tables.length === 0) {
      console.log("   (No tables found)");
    } else {
      tables.forEach(t => {
        console.log(`   - ${Object.values(t)[0]}`);
      });
    }
    
    // Check the admin seed details
    const [admins] = await db.query('SELECT email FROM admins');
    console.log("\n4. Registered Administrator accounts:");
    admins.forEach(admin => {
      console.log(`   - Email: ${admin.email}`);
    });
    console.log("\nAll checks completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("\n   [ERROR] Database connection failed!");
    console.error("   Error details:", err.message);
    console.log("\nTroubleshooting tips:");
    console.log("1. Double check the DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in your .env file.");
    console.log("2. If testing locally, make sure Hostinger's Remote MySQL setting is enabled and permits connection from your IP.");
    console.log("3. If testing directly on Hostinger's console, ensure DB_HOST is set to 127.0.0.1 or localhost.");
    process.exit(1);
  }
}

testConnection();
