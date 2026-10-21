import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { HttpError, wrap, requireFields, isValidDate } from '../util.js';

const r = Router();

const withFacilities = (room) => ({
  ...room,
  fasilitas: db.prepare(
    `SELECT f.id, f.nama FROM facilities f
     JOIN room_facilities rf ON rf.facility_id = f.id WHERE rf.room_id = ?`
  ).all(room.id)
});

function setFacilities(roomId, ids) {
  if (!Array.isArray(ids)) return;
  db.prepare('DELETE FROM room_facilities WHERE room_id = ?').run(roomId);
  const ins = db.prepare('INSERT OR IGNORE INTO room_facilities (room_id, facility_id) VALUES (?,?)');
  ids.forEach((fid) => ins.run(roomId, fid));
}

// Cek ketersediaan kamar pada rentang tanggal
r.get('/rooms/available', wrap((req, res) => {
  const { check_in, check_out, kapasitas = 1, kota } = req.query;
  if (!isValidDate(check_in) || !isValidDate(check_out) || check_out <= check_in) {
    throw new HttpError(400, 'check_in dan check_out harus berformat YYYY-MM-DD dan check_out > check_in');
  }
  const params = [Number(kapasitas) || 1, check_out, check_in];
  let sql = `
    SELECT r.*, h.nama AS nama_homestay, h.kota
    FROM rooms r JOIN homestays h ON h.id = r.homestay_id
    WHERE r.status = 'tersedia' AND r.kapasitas >= ?
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.room_id = r.id AND b.status IN ('pending','confirmed')
          AND b.check_in < ? AND b.check_out > ?)`;
  if (kota) { sql += ' AND h.kota LIKE ?'; params.push(`%${kota}%`); }
  sql += ' ORDER BY r.harga_per_malam';
  res.json(db.prepare(sql).all(...params).map(withFacilities));
}));

r.get('/rooms/:id', wrap((req, res) => {
  const room = db.prepare(
    `SELECT r.*, h.nama AS nama_homestay, h.kota FROM rooms r
     JOIN homestays h ON h.id = r.homestay_id WHERE r.id = ?`
  ).get(req.params.id);
  if (!room) throw new HttpError(404, 'Kamar tidak ditemukan');
  res.json(withFacilities(room));
}));

r.get('/homestays/:id/rooms', wrap((req, res) => {
  const h = db.prepare('SELECT id FROM homestays WHERE id = ?').get(req.params.id);
  if (!h) throw new HttpError(404, 'Homestay tidak ditemukan');
  res.json(db.prepare('SELECT * FROM rooms WHERE homestay_id = ? ORDER BY id').all(h.id).map(withFacilities));
}));

r.post('/homestays/:id/rooms', requireAdmin, wrap((req, res) => {
  const h = db.prepare('SELECT id FROM homestays WHERE id = ?').get(req.params.id);
  if (!h) throw new HttpError(404, 'Homestay tidak ditemukan');
  requireFields(req.body, ['nama_kamar', 'tipe', 'kapasitas', 'harga_per_malam']);
  const { nama_kamar, tipe, kapasitas, harga_per_malam, status = 'tersedia', fasilitas } = req.body;
  if (!(kapasitas > 0) || !(harga_per_malam >= 0)) throw new HttpError(400, 'Kapasitas/harga tidak valid');
  const id = db.prepare(
    'INSERT INTO rooms (homestay_id, nama_kamar, tipe, kapasitas, harga_per_malam, status) VALUES (?,?,?,?,?,?)'
  ).run(h.id, nama_kamar, tipe, kapasitas, harga_per_malam, status).lastInsertRowid;
  setFacilities(id, fasilitas);
  res.status(201).json(withFacilities(db.prepare('SELECT * FROM rooms WHERE id = ?').get(id)));
}));

r.put('/rooms/:id', requireAdmin, wrap((req, res) => {
  const cur = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!cur) throw new HttpError(404, 'Kamar tidak ditemukan');
  const m = { ...cur, ...req.body, id: cur.id, homestay_id: cur.homestay_id };
  db.prepare(
    'UPDATE rooms SET nama_kamar=?, tipe=?, kapasitas=?, harga_per_malam=?, status=? WHERE id=?'
  ).run(m.nama_kamar, m.tipe, m.kapasitas, m.harga_per_malam, m.status, cur.id);
  setFacilities(cur.id, req.body.fasilitas);
  res.json(withFacilities(db.prepare('SELECT * FROM rooms WHERE id = ?').get(cur.id)));
}));

r.delete('/rooms/:id', requireAdmin, wrap((req, res) => {
  const used = db.prepare('SELECT COUNT(*) AS n FROM bookings WHERE room_id = ?').get(req.params.id);
  if (used.n > 0) throw new HttpError(409, 'Kamar masih memiliki riwayat pemesanan');
  const info = db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  if (!info.changes) throw new HttpError(404, 'Kamar tidak ditemukan');
  res.status(204).end();
}));

export default r;
