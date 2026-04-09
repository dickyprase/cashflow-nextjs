# 💰 Cashflowku — Aplikasi Pencatatan Keuangan Pribadi

Cashflowku adalah aplikasi pencatatan keuangan pribadi berbasis web yang modern, dibangun dengan **Next.js 16**, **PostgreSQL (Supabase)**, dan **TailwindCSS 4**. Aplikasi ini mendukung fitur multi-theme, multi-wallet, budgeting harian, goals tracking, laporan keuangan, serta panel admin untuk manajemen pengguna.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Setup Database](#-setup-database)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Data Awal Admin](#-data-awal-admin)
- [Struktur Folder](#-struktur-folder)
- [API Endpoints](#-api-endpoints)

---

## ✨ Fitur Utama

### 👤 Fitur User
- **Dashboard** — Ringkasan keuangan dengan grafik interaktif (Recharts)
- **Transaksi** — Input pemasukan & pengeluaran dengan kategori & wallet
- **Multi-Wallet** — Kelola banyak dompet (Cash, E-Wallet, Bank, Kartu Kredit, Investasi)
- **Transfer Antar Wallet** — Transfer saldo antar wallet dengan dukungan biaya admin
- **Kategori** — Buat & atur kategori pemasukan/pengeluaran dengan warna & ikon
- **Budget Harian** — Atur budget harian secara manual atau dengan formula otomatis
- **Goals (Target Keuangan)** — Buat target tabungan/keuangan dengan tracking progres
- **Laporan Keuangan** — Laporan bulanan & tahunan, export ke PDF & CSV
- **Kalender Aktivitas** — Visualisasi aktivitas transaksi dalam format kalender
- **Profil & Pengaturan** — Ubah profil, password, dan avatar

### 🔧 Fitur Admin
- **Manajemen User** — Lihat, cari, filter, aktifkan/nonaktifkan, reset password user
- **Pengaturan Situs** — Ubah nama situs, logo (light/dark), footer, mata uang, dan tema
- **Statistik User** — Grafik pertumbuhan pengguna per bulan
- **Activity Logs** — Log semua aktivitas penting di sistem

### 🎨 Multi-Theme
- **Modern (Default)** — Glassmorphism style dengan dark mode support
  - Skema warna: Emerald, Ocean, Violet
- **Neo Brutalism** — Bold, contrasty, thick borders
  - Skema warna: Punk Red, Electric Yellow, Bold Blue, Neon Green

### 📱 Progressive Web App (PWA)
- Dapat di-install di perangkat mobile & desktop
- Tampilan standalone portrait

---

## 🛠 Tech Stack

| Komponen       | Teknologi                        |
|----------------|----------------------------------|
| Framework      | Next.js 16 (App Router)          |
| Bahasa         | TypeScript                       |
| Database       | PostgreSQL (Supabase)            |
| Styling        | TailwindCSS 4                    |
| State Mgmt     | React Context + TanStack Query   |
| Animasi        | Framer Motion                    |
| Charts         | Recharts                         |
| Auth           | JWT (jsonwebtoken + bcryptjs)    |
| HTTP Client    | Axios                            |
| PDF Export     | PDFKit                           |
| CSV Export     | json2csv                         |
| Icons          | Lucide React                     |
| Toast          | React Toastify + SweetAlert2     |
| PWA            | next-pwa                         |

---

## 📦 Prasyarat

Pastikan sudah terinstall di komputer Anda:

- **Node.js** versi 18 atau lebih baru — [Download Node.js](https://nodejs.org/)
- **npm** (sudah termasuk dalam Node.js)
- **PostgreSQL** database (bisa menggunakan **Supabase** atau lokal)
- **Git** (opsional, untuk clone repository)

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/dickyprase/cashflow-nextjs.git
cd cashflow-nextjs
```

Atau download dan extract ZIP file, lalu masuk ke folder project.

### 2. Install Dependencies

```bash
npm install
```

---

## ⚙ Konfigurasi Environment

Buat file `.env` di root folder project (atau edit file yang sudah ada):

```env
# === Database ===
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE

# === Auth ===
JWT_SECRET=ganti_dengan_secret_key_anda_yang_aman
JWT_EXPIRES_IN=24h

# === App ===
NEXT_PUBLIC_APP_NAME=Cashflow
```

### Penjelasan Variabel

| Variabel                 | Deskripsi                                          |
|--------------------------|----------------------------------------------------|
| `DATABASE_URL`           | Connection string PostgreSQL                       |
| `JWT_SECRET`             | Secret key untuk signing JWT token (wajib diganti) |
| `JWT_EXPIRES_IN`         | Masa berlaku token JWT (default: 24 jam)           |
| `NEXT_PUBLIC_APP_NAME`   | Nama aplikasi yang tampil di UI                    |

### Contoh untuk PostgreSQL Lokal

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cashflow
```

### Contoh untuk Supabase

```env
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-x-xx-southeast-x.pooler.supabase.com:5432/postgres
```

---

## 🗄 Setup Database

### Menggunakan PostgreSQL Lokal

1. Buat database baru:
   ```sql
   CREATE DATABASE cashflow;
   ```

2. Jalankan file schema untuk membuat semua tabel:
   ```bash
   psql -U postgres -d cashflow -f database/schema.sql
   ```

### Menggunakan Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Buat project baru
3. Buka menu **SQL Editor**
4. Copy & paste isi file `database/schema.sql` dan jalankan

### Tabel yang Dibuat

| Tabel                    | Deskripsi                              |
|--------------------------|----------------------------------------|
| `users`                  | Data pengguna (username, email, role)  |
| `wallets`                | Dompet/rekening milik user             |
| `categories`             | Kategori pemasukan & pengeluaran       |
| `transactions`           | Semua transaksi keuangan               |
| `goals`                  | Target keuangan / tabungan             |
| `goal_wallets`           | Relasi goal ↔ wallet                   |
| `daily_budget_settings`  | Pengaturan budget harian               |
| `site_settings`          | Pengaturan situs (admin)               |
| `activity_logs`          | Log aktivitas sistem                   |

---

## ▶ Menjalankan Aplikasi

### Mode Development

```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

### Mode Production

```bash
npm run build
npm run start
```

---

## 👑 Data Awal Admin

Aplikasi ini **tidak memiliki data seed admin bawaan**. User pertama yang mendaftar akan memiliki role `user`. Untuk membuat akun admin, ikuti langkah berikut:

### Langkah 1: Daftar Akun Baru

Buka browser dan akses `http://localhost:3000/register`, lalu daftar dengan:

| Field    | Nilai (Contoh)            |
|----------|---------------------------|
| Username | `admin`                   |
| Email    | `admin@cashflow.com`      |
| Password | `admin123`                |

### Langkah 2: Ubah Role Menjadi Admin

Setelah akun terdaftar, ubah role menjadi admin via SQL:

```sql
UPDATE users SET role = 'admin' WHERE username = 'admin';
```

**Via Supabase:**
1. Buka Supabase Dashboard → **Table Editor** → tabel `users`
2. Klik baris user yang ingin dijadikan admin
3. Ubah kolom `role` dari `user` menjadi `admin`
4. Klik **Save**

### Langkah 3: Login Ulang

Logout dari aplikasi lalu login kembali agar token JWT diperbarui dengan role `admin`.

### Ringkasan Data Admin

```
┌──────────────────────────────────────────────┐
│           DATA AWAL ADMIN                    │
├──────────────┬───────────────────────────────┤
│ Username     │ admin                         │
│ Email        │ admin@cashflow.com            │
│ Password     │ admin123                      │
│ Role         │ admin (diubah manual via SQL) │
└──────────────┴───────────────────────────────┘
```

> ⚠️ **PENTING:** Ganti password default setelah login pertama melalui menu **Settings** di aplikasi.

---

## 📁 Struktur Folder

```
cashflowku-nextjs/
├── public/                  # Asset statis (icons, manifest PWA)
├── src/
│   ├── app/
│   │   ├── (auth)/          # Halaman Login & Register
│   │   ├── (main)/          # Halaman utama (setelah login)
│   │   │   ├── admin/       # Panel admin (users, settings)
│   │   │   ├── budget/      # Budget harian
│   │   │   ├── categories/  # Manajemen kategori
│   │   │   ├── goals/       # Target keuangan
│   │   │   ├── reports/     # Laporan keuangan
│   │   │   ├── settings/    # Pengaturan profil
│   │   │   ├── transactions/# Riwayat transaksi
│   │   │   └── wallets/     # Manajemen wallet
│   │   └── api/             # API Routes (Next.js Route Handlers)
│   │       ├── admin/       # API admin (users, stats, settings)
│   │       ├── auth/        # API login & register
│   │       ├── categories/  # API kategori
│   │       ├── daily-budget/# API budget harian
│   │       ├── dashboard/   # API dashboard
│   │       ├── goals/       # API goals
│   │       ├── health/      # Health check endpoint
│   │       ├── reports/     # API laporan
│   │       ├── site/        # API pengaturan situs
│   │       ├── transactions/# API transaksi
│   │       └── wallets/     # API wallet & transfer
│   ├── components/          # Komponen UI reusable
│   ├── context/             # React Context (Auth, Theme)
│   ├── features/            # Komponen halaman utama
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Database, auth, models, utils
│   ├── services/            # API client (Axios)
│   ├── themes.ts            # Konfigurasi multi-theme
│   └── types/               # TypeScript type definitions
├── .env                     # Konfigurasi environment
├── next.config.ts           # Konfigurasi Next.js + PWA
├── package.json             # Dependencies & scripts
└── tsconfig.json            # Konfigurasi TypeScript
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Deskripsi         |
|--------|-----------------------|-------------------|
| POST   | `/api/auth/login`     | Login user        |
| POST   | `/api/auth/register`  | Register user     |

### Transactions
| Method | Endpoint                    | Deskripsi                |
|--------|-----------------------------|--------------------------|
| GET    | `/api/transactions`         | List transaksi           |
| POST   | `/api/transactions`         | Buat transaksi baru      |
| PUT    | `/api/transactions/[id]`    | Update transaksi         |
| DELETE | `/api/transactions/[id]`    | Hapus transaksi          |

### Wallets
| Method | Endpoint                    | Deskripsi                |
|--------|-----------------------------|--------------------------|
| GET    | `/api/wallets`              | List wallet              |
| POST   | `/api/wallets`              | Buat wallet baru         |
| POST   | `/api/wallets/transfer`     | Transfer antar wallet    |

### Categories
| Method | Endpoint                    | Deskripsi                |
|--------|-----------------------------|--------------------------|
| GET    | `/api/categories`           | List kategori            |
| POST   | `/api/categories`           | Buat kategori baru       |

### Goals
| Method | Endpoint                    | Deskripsi                |
|--------|-----------------------------|--------------------------|
| GET    | `/api/goals`                | List goals               |
| POST   | `/api/goals`                | Buat goal baru           |

### Admin (role: admin)
| Method | Endpoint                              | Deskripsi             |
|--------|---------------------------------------|-----------------------|
| GET    | `/api/admin/users`                    | List semua user       |
| GET    | `/api/admin/stats`                    | Statistik user        |
| GET    | `/api/admin/user-growth`              | Grafik pertumbuhan    |
| GET    | `/api/admin/activity-logs`            | Activity logs         |
| GET    | `/api/admin/site-settings`            | Pengaturan situs      |
| PUT    | `/api/admin/site-settings`            | Update pengaturan     |
| PUT    | `/api/admin/users/[id]`               | Update user           |
| PUT    | `/api/admin/users/[id]/toggle-status` | Aktif/nonaktifkan     |
| PUT    | `/api/admin/users/[id]/reset-password`| Reset password user   |

### Lainnya
| Method | Endpoint                    | Deskripsi              |
|--------|-----------------------------|------------------------|
| GET    | `/api/health`               | Health check           |
| GET    | `/api/dashboard`            | Data dashboard         |
| GET    | `/api/reports`              | Data laporan           |
| GET    | `/api/daily-budget`         | Pengaturan budget      |
| GET    | `/api/site/settings`        | Pengaturan situs publik|

---

## 📄 Lisensi

Aplikasi ini dibuat untuk keperluan edukasi dan penggunaan pribadi.

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan fork repository ini dan buat pull request.
