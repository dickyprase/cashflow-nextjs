===========================================================
  CASHFLOWKU — Aplikasi Pencatatan Keuangan Pribadi
  Panduan Instalasi & Menjalankan Aplikasi
===========================================================

DESKRIPSI
---------
Cashflowku adalah aplikasi pencatatan keuangan pribadi
berbasis web yang modern, dibangun dengan Next.js 16,
PostgreSQL (Supabase), dan TailwindCSS 4.

Fitur: Multi-Wallet, Multi-Theme, Budget Harian,
Goals Tracking, Laporan PDF/CSV, dan Panel Admin.


PRASYARAT
---------
1. Node.js versi 18 atau lebih baru
   Download: https://nodejs.org/
2. PostgreSQL database (lokal atau Supabase)
3. Git (opsional)


INSTALASI
---------
1. Clone atau download project:

   git clone https://github.com/dickyprase/cashflow-nextjs.git
   cd cashflow-nextjs

2. Install dependencies:

   npm install

3. Konfigurasi file .env di root folder:

   # === Database ===
   DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE

   # === Auth ===
   JWT_SECRET=ganti_dengan_secret_key_anda
   JWT_EXPIRES_IN=24h

   # === App ===
   NEXT_PUBLIC_APP_NAME=Cashflow

   Contoh PostgreSQL lokal:
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cashflow

   Contoh Supabase:
   DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-x-xx.pooler.supabase.com:5432/postgres

4. Setup Database:

   a) PostgreSQL Lokal:
      - Buat database: CREATE DATABASE cashflow;
      - Jalankan schema:
        psql -U postgres -d cashflow -f database/schema.sql

   b) Supabase:
      - Buka Supabase Dashboard > SQL Editor
      - Copy & paste isi file database/schema.sql
      - Jalankan query


MENJALANKAN APLIKASI
--------------------
Mode Development:

   npm run dev

   Buka browser: http://localhost:3000

Mode Production:

   npm run build
   npm run start


DATA AWAL ADMIN
---------------
Aplikasi ini TIDAK memiliki data seed admin bawaan.
User pertama yang mendaftar memiliki role "user".

Untuk membuat akun admin, ikuti langkah berikut:

Langkah 1: Daftar Akun Baru
   Buka http://localhost:3000/register
   Daftar dengan data berikut:

   Username : admin
   Email    : admin@cashflow.com
   Password : admin123

Langkah 2: Ubah Role Menjadi Admin
   Jalankan SQL berikut di database:

   UPDATE users SET role = 'admin' WHERE username = 'admin';

   Via Supabase:
   - Buka Dashboard > Table Editor > tabel "users"
   - Klik baris user yang ingin dijadikan admin
   - Ubah kolom "role" dari "user" menjadi "admin"
   - Klik Save

Langkah 3: Login Ulang
   Logout lalu login kembali agar token JWT
   diperbarui dengan role admin.

+----------------------------------------------+
|           DATA AWAL ADMIN                    |
+--------------+-------------------------------+
| Username     | admin                         |
| Email        | admin@cashflow.com            |
| Password     | admin123                      |
| Role         | admin (diubah manual via SQL) |
+--------------+-------------------------------+

PENTING: Ganti password default setelah login
pertama melalui menu Settings di aplikasi.


FITUR UTAMA
-----------
[User]
- Dashboard ringkasan keuangan dengan grafik
- Input transaksi pemasukan & pengeluaran
- Multi-Wallet (Cash, E-Wallet, Bank, dll)
- Transfer antar wallet + biaya admin
- Kategori kustom dengan warna & ikon
- Budget harian (manual / formula)
- Goals / target keuangan
- Laporan bulanan & tahunan (PDF & CSV)
- Kalender aktivitas transaksi
- Profil & pengaturan akun

[Admin]
- Manajemen user (aktifkan/nonaktifkan/reset)
- Pengaturan situs (nama, logo, footer, tema)
- Statistik & grafik pertumbuhan pengguna
- Activity logs

[Theme]
- Modern (Glassmorphism) + Dark Mode
  Warna: Emerald, Ocean, Violet
- Neo Brutalism
  Warna: Punk Red, Electric Yellow, Bold Blue, Neon Green


TECH STACK
----------
- Next.js 16 (App Router)
- TypeScript
- PostgreSQL (Supabase)
- TailwindCSS 4
- React Context + TanStack Query
- Framer Motion (animasi)
- Recharts (grafik)
- JWT Auth (jsonwebtoken + bcryptjs)
- Axios
- PDFKit (export PDF)
- json2csv (export CSV)
- Lucide React (ikon)
- React Toastify + SweetAlert2
- next-pwa (Progressive Web App)


STRUKTUR FOLDER
---------------
cashflowku-nextjs/
+-- public/               Asset statis, manifest PWA
+-- src/
|   +-- app/
|   |   +-- (auth)/       Halaman Login & Register
|   |   +-- (main)/       Halaman utama (setelah login)
|   |   |   +-- admin/    Panel admin
|   |   |   +-- budget/   Budget harian
|   |   |   +-- categories/ Manajemen kategori
|   |   |   +-- goals/    Target keuangan
|   |   |   +-- reports/  Laporan keuangan
|   |   |   +-- settings/ Pengaturan profil
|   |   |   +-- transactions/ Riwayat transaksi
|   |   |   +-- wallets/  Manajemen wallet
|   |   +-- api/          API Routes
|   +-- components/       Komponen UI reusable
|   +-- context/          React Context (Auth, Theme)
|   +-- features/         Komponen halaman utama
|   +-- hooks/            Custom React hooks
|   +-- lib/              Database, auth, models
|   +-- services/         API client (Axios)
|   +-- themes.ts         Konfigurasi multi-theme
|   +-- types/            TypeScript definitions
+-- .env                  Environment variables
+-- next.config.ts        Konfigurasi Next.js + PWA
+-- package.json          Dependencies & scripts


===========================================================
  (c) 2026 Cashflowku. All rights reserved.
===========================================================
