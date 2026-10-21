import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'homestay.db');

const raw = new DatabaseSync(dbPath);
raw.exec('PRAGMA foreign_keys = ON');
raw.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Migrasi ringan: database lama belum punya kolom bookings.user_id
const kolom = raw.prepare('PRAGMA table_info(bookings)').all();
if (!kolom.some((k) => k.name === 'user_id')) {
  raw.exec('ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id)');
}

// Pembungkus tipis agar kode lain tetap sederhana (SQLite bawaan Node, tanpa kompilasi native)
export const db = {
  prepare: (sql) => raw.prepare(sql),
  exec: (sql) => raw.exec(sql),
  transaction: (fn) => (...args) => {
    raw.exec('BEGIN');
    try {
      const result = fn(...args);
      raw.exec('COMMIT');
      return result;
    } catch (e) {
      raw.exec('ROLLBACK');
      throw e;
    }
  }
};

/** Isi data contoh bila database masih kosong (penting untuk hosting gratis). */
export function seedIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM homestays').get();
  if (n > 0) return false;

  const tx = db.transaction(() => {
    const facs = ['WiFi', 'Sarapan', 'AC', 'Parkir', 'Air Panas', 'Dapur Bersama'];
    const insFac = db.prepare('INSERT INTO facilities (nama) VALUES (?)');
    facs.forEach((f) => insFac.run(f));

    const insH = db.prepare(
      `INSERT INTO homestays (nama, alamat, kota, deskripsi, nomor_kontak, foto_url)
       VALUES (?,?,?,?,?,?)`
    );
    const h1 = insH.run('Homestay Tepi Toba', 'Jl. Pantai Tuk Tuk No. 12, Samosir', 'Samosir',
      'Homestay bernuansa rumah Batak dengan pemandangan langsung ke Danau Toba.', '081234567001', null).lastInsertRowid;
    const h2 = insH.run('Pondok Sinabung View', 'Jl. Jamin Ginting Km 46, Berastagi', 'Berastagi',
      'Penginapan sejuk dengan pemandangan Gunung Sinabung dan kebun jeruk.', '081234567002', null).lastInsertRowid;
    const h3 = insH.run('Rumah Singgah Parapat', 'Jl. Sisingamangaraja No. 5, Parapat', 'Parapat',
      'Rumah singgah keluarga, dekat dermaga penyeberangan Tomok.', '081234567003', null).lastInsertRowid;

    const insR = db.prepare(
      `INSERT INTO rooms (homestay_id, nama_kamar, tipe, kapasitas, harga_per_malam)
       VALUES (?,?,?,?,?)`
    );
    const rooms = [
      insR.run(h1, 'Kamar Danau', 'Double', 2, 250000).lastInsertRowid,
      insR.run(h1, 'Kamar Keluarga', 'Family', 5, 450000).lastInsertRowid,
      insR.run(h2, 'Kamar Kebun', 'Twin', 2, 200000).lastInsertRowid,
      insR.run(h2, 'Kamar Gunung', 'Double', 3, 300000).lastInsertRowid,
      insR.run(h3, 'Kamar Standar', 'Single', 1, 150000).lastInsertRowid,
      insR.run(h3, 'Kamar Premium', 'Double', 2, 350000).lastInsertRowid
    ];
    const insRF = db.prepare('INSERT INTO room_facilities (room_id, facility_id) VALUES (?,?)');
    rooms.forEach((r, i) => {
      [1, 4].forEach((f) => insRF.run(r, f));
      if (i % 2 === 0) insRF.run(r, 2);
      if (i % 3 === 0) insRF.run(r, 3);
      if (i % 2 === 1) insRF.run(r, 5);
    });

    const g = db.prepare('INSERT INTO guests (nama, email, telepon) VALUES (?,?,?)')
      .run('Budi Santoso', 'budi@example.com', '082111111111').lastInsertRowid;
    const b = db.prepare(
      `INSERT INTO bookings (room_id, guest_id, check_in, check_out, jumlah_tamu, total_harga, status)
       VALUES (?,?,?,?,?,?,?)`
    ).run(rooms[0], g, '2026-09-01', '2026-09-03', 2, 500000, 'completed').lastInsertRowid;
    db.prepare('INSERT INTO reviews (booking_id, rating, komentar) VALUES (?,?,?)')
      .run(b, 5, 'Pemandangan luar biasa, pemilik sangat ramah.');
  });
  tx();
  return true;
}
