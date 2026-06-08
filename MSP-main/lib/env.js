const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
];

function isPlaceholder(value) {
  if (!value) return true;
  const valLower = value.toLowerCase();
  return valLower.includes('your_') || valLower.includes('optional_');
}

function validateEnv() {
  const missing = [];
  for (const name of REQUIRED_ENV_VARS) {
    if (!process.env[name] || isPlaceholder(process.env[name])) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    const errorMsg = `Configuration Error: Missing or default required environment variable(s): ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

module.exports = {
  validateEnv
};
