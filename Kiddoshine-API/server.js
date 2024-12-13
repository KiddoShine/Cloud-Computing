const Hapi = require('@hapi/hapi');
const fs = require('fs');
const admin = require('firebase-admin');
const path = require('path');
const jwt = require('./utils/jwt'); // Sesuaikan path jika perlu
const serviceAccountKey = require('./firebase-env.json');
require('dotenv').config();

const init = async () => {
  // Memastikan Firebase hanya di-initialize sekali
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        // Jika Anda tidak menggunakan Firebase Storage, hapus baris ini
        // storageBucket: 'stuntingmodel.firebasestorage.app', 
      });
      console.log("Firebase terhubung dengan sukses.");
    } catch (error) {
      console.error("Gagal menghubungkan Firebase:", error);
      process.exit(1); // Hentikan aplikasi jika gagal terhubung
    }
  }

  // Membuat server Hapi
  const server = Hapi.server({
    port: 4000,
    host: 'localhost',  // Menggunakan 0.0.0.0 untuk akses dari luar (misal dalam Docker atau cloud)
  });

  // Memuat semua rute dari folder yang relevan
  const routesFolders = ['./User'];

  routesFolders.forEach((folder) => {
    const files = fs.readdirSync(path.resolve(__dirname, folder));
    files.forEach((file) => {
      if (file.startsWith('Routes') && file.endsWith('.js')) {
        const routes = require(path.resolve(__dirname, folder, file));
        server.route(routes);
      }
    });
  });

  // Menangani error yang tidak terduga
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    if (response.isBoom) {
      const { output } = response;
      return h.response({
        statusCode: output.statusCode,
        message: output.payload.message,
        error: output.payload.error
      }).code(output.statusCode);
    }
    return h.continue;
  });

  // Menjalankan server
  await server.start();
  console.log('Server berjalan pada %s', server.info.uri);
};

// Menangani error yang tidak terduga
process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1); // Keluar dengan kode error
});

// Inisialisasi server
init();
