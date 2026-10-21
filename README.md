# Platform Manajemen & Pemesanan Homestay Lokal

Proyek 1 — Pengembangan Aplikasi Berbasis Web.

- **Back-end:** Express.js + SQLite (modul bawaan Node `node:sqlite`, tanpa kompilasi native), menyediakan REST API
- **Front-end:** SvelteKit (Svelte 5) dengan `adapter-static` (mode SPA)
- **CI:** Jenkins (`Jenkinsfile`)

## Fitur
- **Login & peran:** akun `tamu` (daftar sendiri) dan `admin` (pemilik), autentikasi JWT + bcrypt
- CRUD homestay & kamar, daftar fasilitas
- Cek ketersediaan kamar berdasarkan tanggal & jumlah tamu
- Pemesanan dengan **validasi bentrok tanggal**, validasi kapasitas, dan **total harga otomatis**
- Alur status: `pending → confirmed → completed` (atau `cancelled`)
- Ulasan & rata-rating per homestay (hanya untuk pemesanan `completed`)
- Data contoh (seed) otomatis saat database kosong

## Akun & hak akses
Akun admin dibuat otomatis saat back-end pertama kali jalan:

| Role | Email | Password |
|---|---|---|
| admin | `admin@homestay.local` | `admin123` (ubah lewat `ADMIN_EMAIL` / `ADMIN_PASSWORD`) |
| tamu | daftar sendiri di halaman **Daftar Akun** (`/auth/register`); login di `/auth/login` | - |

- **Belum login:** hanya dapat membuka halaman `/auth/login` dan `/auth/register`; semua halaman lain otomatis diarahkan ke login.
- **Setelah login:** lihat homestay/kamar/ulasan, cek ketersediaan (endpoint GET publik tetap terbuka untuk API).
- **Tamu (login):** memesan kamar, melihat & membatalkan pesanan sendiri, mengulas pesanan yang sudah selesai.
- **Admin:** halaman **Admin → Homestay & Kamar** untuk tambah/ubah/hapus homestay dan kamar (termasuk fasilitas, harga, status aktif/nonaktif), serta **Admin → Pemesanan** untuk konfirmasi/selesaikan/batalkan.

Untuk produksi **wajib** set `JWT_SECRET` (string acak panjang) dan ganti password admin.

## Menjalankan di komputer lokal
Prasyarat: **Node.js 22.13 atau lebih baru** (termasuk 24) dan Git.

```bash
git clone <URL-REPOSITORY-ANDA>
cd homestay-app

# Terminal 1 — back-end
cd backend
cp .env.example .env
npm install
npm run dev            # http://localhost:3000

# Terminal 2 — front-end
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

Pengujian back-end: `cd backend && npm test`
Build front-end: `cd frontend && npm run build` (hasil di `frontend/build/`)

## Endpoint API
| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Daftar / masuk (mengembalikan token) |
| GET | `/api/auth/me` | Profil dari token (header `Authorization: Bearer <token>`) |
| GET/POST | `/api/homestays` | Daftar (`?q=`, `?kota=`) / tambah (**admin**) |
| GET/PUT/DELETE | `/api/homestays/:id` | Detail / ubah / hapus |
| GET | `/api/homestays/:id/reviews` | Ulasan homestay |
| GET/POST | `/api/homestays/:id/rooms` | Kamar milik homestay |
| GET/PUT/DELETE | `/api/rooms/:id` | Detail / ubah / hapus kamar |
| GET | `/api/rooms/available?check_in=&check_out=&kapasitas=&kota=` | Cek ketersediaan |
| GET/POST | `/api/guests` | Tamu (**admin**) |
| GET | `/api/bookings` | Semua pemesanan (**admin**, `?status=`) |
| GET | `/api/bookings/mine` | Pemesanan milik sendiri (login) |
| POST | `/api/bookings` | Buat pemesanan (login) |
| GET | `/api/bookings/:id` | Detail pemesanan |
| PATCH | `/api/bookings/:id/status` | Ubah status; admin semua transisi, pemilik hanya `cancelled` |
| GET/POST | `/api/reviews` | Ulasan |
| GET | `/api/facilities` | Fasilitas |
| GET | `/api/health` | Health check |

Contoh membuat pemesanan:
```json
POST /api/bookings        (header: Authorization: Bearer <token>)
{
  "room_id": 3,
  "check_in": "2026-12-01",
  "check_out": "2026-12-04",
  "jumlah_tamu": 2,
  "telepon": "0812..."
}
```

## Skema database
`homestays` 1—N `rooms` N—M `facilities` (via `room_facilities`);
`rooms` 1—N `bookings` N—1 `guests`; `users` 1—N `bookings`; `bookings` 1—1 `reviews`.
Skema lengkap ada di `backend/src/schema.sql`.

## Deployment
**Back-end (Render/Railway):** root directory `backend`, build `npm install`, start `npm start`.
Variabel: `CORS_ORIGIN=<URL front-end>`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Catatan: filesystem gratis bisa direset, tetapi data contoh
otomatis dibuat ulang saat server start.

**Front-end (Vercel/Netlify):** root directory `frontend`, build `npm run build`, output `build`.
Variabel: `VITE_API_URL=https://<URL-backend>/api` (harus diset **sebelum** build).
File `static/_redirects` sudah menangani refresh pada route dinamis di Netlify
(untuk Vercel, tambahkan rewrite `/(.*)` → `/index.html`).

## Jenkins
Buat job *Pipeline from SCM* yang menunjuk ke repository ini. Stage: install & test back-end,
install & build front-end, lalu arsipkan `frontend/build`. Screenshot hasil build adalah bukti
pengujian deployment untuk dikumpulkan.
