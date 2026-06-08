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

const CLOUDINARY_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

function isPlaceholder(value) {
  if (!value) return true;
  const valLower = value.toLowerCase();
  return valLower.includes('your_') || valLower.includes('optional_');
}

let warnedAboutCloudinary = false;

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

  // Soft check for Cloudinary configurations
  const missingCloudinary = CLOUDINARY_VARS.filter(name => !process.env[name] || isPlaceholder(process.env[name]));
  if (missingCloudinary.length > 0 && !warnedAboutCloudinary) {
    console.warn(`[WARNING] Cloudinary image hosting is not fully configured (missing/placeholder: ${missingCloudinary.join(', ')}). Product image uploads will fail, but catalog reading and database connections will work.`);
    warnedAboutCloudinary = true;
  }
}

module.exports = {
  validateEnv
};
