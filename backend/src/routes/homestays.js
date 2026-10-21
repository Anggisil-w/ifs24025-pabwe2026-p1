import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { HttpError, wrap, requireFields } from '../util.js';

const r = Router();

const LIST_SQL = `
  SELECT h.*,
    (SELECT COUNT(*) FROM rooms WHERE homestay_id = h.id) AS jumlah_kamar,
    (SELECT MIN(harga_per_malam) FROM rooms WHERE homestay_id = h.id AND status='tersedia') AS harga_mulai,
    (SELECT ROUND(AVG(rv.rating),1) FROM reviews rv
       JOIN bookings b ON b.id = rv.booking_id
       JOIN rooms rm ON rm.id = b.room_id WHERE rm.homestay_id = h.id) AS rata_rating
  FROM homestays h`;

r.get('/', wrap((req, res) => {
  const { q, kota } = req.query;
  const where = [];
  const params = [];
  if (q) { where.push('(h.nama LIKE ? OR h.deskripsi LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (kota) { where.push('h.kota LIKE ?'); params.push(`%${kota}%`); }
  const sql = LIST_SQL + (where.length ? ` WHERE ${where.join(' AND ')}` : '') + ' ORDER BY h.id';
  res.json(db.prepare(sql).all(...params));
}));

r.get('/:id', wrap((req, res) => {
  const row = db.prepare(LIST_SQL + ' WHERE h.id = ?').get(req.params.id);
  if (!row) throw new HttpError(404, 'Homestay tidak ditemukan');
  res.json(row);
}));

r.post('/', requireAdmin, wrap((req, res) => {
  requireFields(req.body, ['nama', 'alamat', 'kota']);
  const { nama, alamat, kota, deskripsi = null, nomor_kontak = null, foto_url = null } = req.body;
  const info = db.prepare(
    'INSERT INTO homestays (nama, alamat, kota, deskripsi, nomor_kontak, foto_url) VALUES (?,?,?,?,?,?)'
  ).run(nama, alamat, kota, deskripsi, nomor_kontak, foto_url);
  res.status(201).json(db.prepare('SELECT * FROM homestays WHERE id = ?').get(info.lastInsertRowid));
}));

r.put('/:id', requireAdmin, wrap((req, res) => {
  const cur = db.prepare('SELECT * FROM homestays WHERE id = ?').get(req.params.id);
  if (!cur) throw new HttpError(404, 'Homestay tidak ditemukan');
  const m = { ...cur, ...req.body, id: cur.id };
  db.prepare(
    'UPDATE homestays SET nama=?, alamat=?, kota=?, deskripsi=?, nomor_kontak=?, foto_url=? WHERE id=?'
  ).run(m.nama, m.alamat, m.kota, m.deskripsi, m.nomor_kontak, m.foto_url, cur.id);
  res.json(db.prepare('SELECT * FROM homestays WHERE id = ?').get(cur.id));
}));

r.delete('/:id', requireAdmin, wrap((req, res) => {
  const used = db.prepare(
    `SELECT COUNT(*) AS n FROM bookings b JOIN rooms r ON r.id=b.room_id WHERE r.homestay_id=?`
  ).get(req.params.id);
  if (used.n > 0) throw new HttpError(409, 'Homestay masih memiliki riwayat pemesanan');
  const info = db.prepare('DELETE FROM homestays WHERE id = ?').run(req.params.id);
  if (!info.changes) throw new HttpError(404, 'Homestay tidak ditemukan');
  res.status(204).end();
}));

r.get('/:id/reviews', wrap((req, res) => {
  res.json(db.prepare(
    `SELECT rv.id, rv.rating, rv.komentar, rv.created_at, g.nama AS nama_tamu
     FROM reviews rv
     JOIN bookings b ON b.id = rv.booking_id
     JOIN rooms rm ON rm.id = b.room_id
     JOIN guests g ON g.id = b.guest_id
     WHERE rm.homestay_id = ? ORDER BY rv.created_at DESC`
  ).all(req.params.id));
}));

export default r;
