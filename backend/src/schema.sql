CREATE TABLE IF NOT EXISTS homestays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  alamat TEXT NOT NULL,
  kota TEXT NOT NULL,
  deskripsi TEXT,
  nomor_kontak TEXT,
  foto_url TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homestay_id INTEGER NOT NULL REFERENCES homestays(id) ON DELETE CASCADE,
  nama_kamar TEXT NOT NULL,
  tipe TEXT NOT NULL,
  kapasitas INTEGER NOT NULL CHECK (kapasitas > 0),
  harga_per_malam INTEGER NOT NULL CHECK (harga_per_malam >= 0),
  status TEXT NOT NULL DEFAULT 'tersedia' CHECK (status IN ('tersedia','nonaktif'))
);

CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS room_facilities (
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, facility_id)
);

CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telepon TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  guest_id INTEGER NOT NULL REFERENCES guests(id),
  user_id INTEGER REFERENCES users(id),
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  jumlah_tamu INTEGER NOT NULL CHECK (jumlah_tamu > 0),
  total_harga INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rooms_homestay ON rooms(homestay_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tamu' CHECK (role IN ('admin','tamu')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
