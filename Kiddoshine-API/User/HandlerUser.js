const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcryptjs'); // Ganti bcrypt dengan bcryptjs
const { createToken } = require('../utils/jwt');

const keyFilePath = path.resolve(__dirname, '../firebase-env.json');

// Inisialisasi Firestore
const firestore = new Firestore({
  projectId: 'stuntingmodel',
  keyFilename: keyFilePath,
});

// Tambah user baru
const addUser = async (payload) => {
  const { email, name, password } = payload;

  if (!email || !name || !password) {
    return {
      code: 400,
      status: 'Bad Request',
      data: { message: 'Semua field (email, name, password) wajib diisi' },
    };
  }

  try {
    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    const docRef = firestore.collection('Users').doc(); // Pastikan koleksi menggunakan 'Users'
    await docRef.set({
      email,
      name,
      password: hashedPassword, // Simpan password yang sudah di-hash
    });

    return {
      code: 201,
      status: 'Created',
      data: {
        message: 'Registrasi berhasil',
        id: docRef.id,
      },
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      code: 500,
      status: 'Internal Server Error',
      data: { message: 'Terjadi kesalahan saat registrasi' },
    };
  }
};

// Ambil semua user
const getAllUsers = async () => {
  const snapshot = await firestore.collection('Users').get(); // Pastikan koleksi menggunakan 'Users'

  if (snapshot.empty) {
    return {
      code: 404,
      status: 'Not Found',
      data: [],
    };
  }

  const users = snapshot.docs.map((doc) => {
    const userData = doc.data();
    
    // Hapus field password dari objek userData
    const { password, ...userWithoutPassword } = userData;

    return {
      id: doc.id,
      ...userWithoutPassword, // return data tanpa password
    };
  });

  return {
    code: 200,
    status: 'Success',
    data: users,
  };
};

// Ambil user berdasarkan ID
const getUserById = async (userId) => {
  const userDocRef = firestore.collection('Users').doc(userId); // Pastikan koleksi menggunakan 'Users'
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    return {
      code: 404,
      status: 'Not Found',
      data: {},
    };
  }

  // Ambil data pengguna
  const userData = userDoc.data();

  // Hapus field password dari objek data
  const { password, ...userWithoutPassword } = userData;

  return {
    code: 200,
    status: 'Success',
    data: {
      id: userDoc.id,
      ...userWithoutPassword, // return data tanpa password
    },
  };
};

// Handler untuk login
const loginHandler = async (request, h) => {
  const { email, password } = request.payload;

  if (!email || !password) {
    return h.response({
      code: 400,
      status: 'Bad Request',
      data: { message: 'Email dan password wajib diisi' },
    }).code(400);
  }

  try {
    console.log(`Menerima permintaan login untuk email: ${email}`);

    const userQuery = await firestore.collection('Users').where('email', '==', email).get(); // Pastikan koleksi menggunakan 'Users'

    if (userQuery.empty) {
      console.log('Tidak ditemukan user dengan email yang diberikan');
      return h.response({
        code: 401,
        status: 'Unauthorized',
        data: { message: 'Email atau password salah' },
      }).code(401);
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    console.log('User ditemukan:', userData);

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    console.log(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      return h.response({
        code: 401,
        status: 'Unauthorized',
        data: { message: 'Email atau password salah' },
      }).code(401);
    }

    const token = createToken({ id: userDoc.id, email: userData.email });
    console.log('Token JWT berhasil dibuat:', token);

    return h.response({
      code: 200,
      status: 'Success',
      data: {
        message: 'Login berhasil',
        token,
        userId: userDoc.id,
      },
    }).code(200);
  } catch (error) {
    console.error('Terjadi kesalahan saat login:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

module.exports = { addUser, getAllUsers, getUserById, loginHandler };