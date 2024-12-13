require('dotenv').config();
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY; // Simpan secara aman

// Membuat token JWT
const createToken = (payload) => {
  // Membuat token dengan masa berlaku 30 hari
  return jwt.sign(payload, secretKey, { expiresIn: '30d' });
};

// Memverifikasi token JWT
const verifyToken = (token) => {
  try {
    // Verifikasi token dan kembalikan payload jika valid
    return jwt.verify(token, secretKey);
  } catch (err) {
    // Jika token tidak valid atau kadaluarsa
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token telah kadaluarsa');
    } else {
      throw new Error('Token tidak valid');
    }
  }
};

module.exports = { createToken, verifyToken };
