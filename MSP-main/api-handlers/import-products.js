const { verifyAdmin } = require('../lib/auth');
const startImport = require('../scripts/import-products');

module.exports = async (req, res) => {
  const isAdmin = verifyAdmin(req, res);
  if (!isAdmin) return;

  // Set headers for streaming logs in real-time to prevent request timeout
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write("Starting import process...\n");

  try {
    const logFn = (msg) => {
      res.write(`${msg}\n`);
      console.log(msg);
    };

    const result = await startImport(logFn);
    res.write(`\nSUCCESS: Imported/Updated ${result.count} products successfully!\n`);
    res.end();
  } catch (err) {
    res.write(`\nFATAL ERROR: ${err.message}\n`);
    res.end();
  }
};
