module.exports = async (req, res) => {
  const vars = {
    DB_HOST: process.env.DB_HOST ? process.env.DB_HOST.substring(0, 10) + '...' : 'NOT SET',
    DB_PORT: process.env.DB_PORT || 'NOT SET',
    DB_USER: process.env.DB_USER ? process.env.DB_USER.substring(0, 5) + '...' : 'NOT SET',
    DB_PASSWORD: process.env.DB_PASSWORD ? '***SET***' : 'NOT SET',
    DB_NAME: process.env.DB_NAME || 'NOT SET',
    DB_SSL: process.env.DB_SSL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  };
  return res.status(200).json(vars);
};
