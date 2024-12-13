# API KiddoShine
Api ini membantu memprediksi stunting.

# Instalasi dibagi menjadi 2
## Instalasi Kiddoshine-API
1. Clone repository:
   ```bash
   git clone https://github.com/KiddoShine/Cloud-Computing.git
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd Kiddoshine-API
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Jalankan aplikasi:
   ```bash
   npm run start
   ```
## Instalasi Model-API
1. Clone repository:
   ```bash
   git clone https://github.com/KiddoShine/Cloud-Computing.git
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd Model-API
   ```
3. Install dependencies:
   ```bash
   pip install requirements.txt
   ```
4. Jalankan aplikasi:
   ```bash
   python main.py
   ```

## Penggunaan
1. Buka Postman.
2. Testing endpoint
3. Input data anak.
4. Lihat hasil prediksi stunting.

## Endpoint
1. Register
   ```bash
   /register
   ```
2. Login
   ```bash
   /login
   ```
3. Prediksi
   ```bash
   /predict/{userId}
   ```
