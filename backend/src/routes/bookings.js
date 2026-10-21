import { Router } from 'express';
import { db } from '../db.js';
import { HttpError, wrap, requireFields, isValidDate, nightsBetween } from '../util.js';
import { requireAuth, requireAdmin } from '../auth.js';

const r = Router();

const SELECT = `
  SELECT b.*, g.nama AS nama_tamu, g.email AS email_tamu,
         r.nama_kamar, h.nama AS nama_homestay,
         EXISTS(SELECT 1 FROM reviews rv WHERE rv.booking_id = b.id) AS sudah_diulas
  FROM bookings b
  JOIN guests g ON g.id = b.guest_id
  JOIN rooms r ON r.id = b.room_id
  JOIN homestays h ON h.id = r.homestay_id`;

const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: []
};

// Admin: semua pemesanan
r.get('/', requireAdmin, wrap((req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare(SELECT + ' WHERE b.status = ? ORDER BY b.id DESC').all(status)
    : db.prepare(SELECT + ' ORDER BY b.id DESC').all();
  res.json(rows);
}));

// Tamu: pemesanan milik sendiri (harus didefinisikan sebelum '/:id')
r.get('/mine', requireAuth, wrap((req, res) => {
  res.json(db.prepare(SELECT + ' WHERE b.user_id = ? ORDER BY b.id DESC').all(req.user.id));
}));

r.get('/:id', requireAuth, wrap((req, res) => {
  const row = db.prepare(SELECT + ' WHERE b.id = ?').get(req.params.id);
  if (!row) throw new HttpError(404, 'Pemesanan tidak ditemukan');
  if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
    throw new HttpError(403, 'Anda tidak berhak melihat pemesanan ini');
  }
  res.json(row);
}));

/**
 * Tamu login: { room_id, check_in, check_out, jumlah_tamu, telepon? } (data tamu dari akun)
 * Admin     : boleh menambahkan guest_id atau objek guest { nama, email, telepon }.
 */
r.post('/', requireAuth, wrap((req, res) => {
  requireFields(req.body, ['room_id', 'check_in', 'check_out', 'jumlah_tamu']);
  const { room_id, check_in, check_out, jumlah_tamu } = req.body;
  let { guest_id, guest } = req.body;

  if (req.user.role !== 'admin') {
    guest_id = undefined;
    guest = { nama: req.user.nama, email: req.user.email, telepon: req.body.telepon ?? null };
  }

  if (!isValidDate(check_in) || !isValidDate(check_out)) {
    throw new HttpError(400, 'Format tanggal harus YYYY-MM-DD');
  }
  if (check_out <= check_in) throw new HttpError(400, 'check_out harus setelah check_in');
  if (!Number.isInteger(jumlah_tamu) || jumlah_tamu < 1) throw new HttpError(400, 'jumlah_tamu tidak valid');

  const result = db.transaction(() => {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id);
    if (!room) throw new HttpError(404, 'Kamar tidak ditemukan');
    if (room.status !== 'tersedia') throw new HttpError(409, 'Kamar sedang tidak tersedia');
    if (jumlah_tamu > room.kapasitas) {
      throw new HttpError(400, `Jumlah tamu melebihi kapasitas kamar (${room.kapasitas})`);
    }

    // Validasi bentrok tanggal
    const clash = db.prepare(
      `SELECT 1 FROM bookings
       WHERE room_id = ? AND status IN ('pending','confirmed')
         AND check_in < ? AND check_out > ?`
    ).get(room_id, check_out, check_in);
    if (clash) throw new HttpError(409, 'Kamar sudah dipesan pada rentang tanggal tersebut');

    // Tentukan tamu
    let gid = guest_id;
    if (gid) {
      if (!db.prepare('SELECT 1 FROM guests WHERE id = ?').get(gid)) throw new HttpError(404, 'Tamu tidak ditemukan');
    } else if (guest) {
      requireFields(guest, ['nama', 'email']);
      if (!/^\S+@\S+\.\S+$/.test(guest.email)) throw new HttpError(400, 'Format email tidak valid');
      const ex = db.prepare('SELECT id FROM guests WHERE email = ?').get(guest.email);
      gid = ex
        ? ex.id
        : db.prepare('INSERT INTO guests (nama, email, telepon) VALUES (?,?,?)')
            .run(guest.nama, guest.email, guest.telepon ?? null).lastInsertRowid;
    } else {
      throw new HttpError(400, 'Sertakan guest_id atau objek guest');
    }

    const total = nightsBetween(check_in, check_out) * room.harga_per_malam;
    return db.prepare(
      `INSERT INTO bookings (room_id, guest_id, user_id, check_in, check_out, jumlah_tamu, total_harga)
       VALUES (?,?,?,?,?,?,?)`
    ).run(room_id, gid, req.user.id, check_in, check_out, jumlah_tamu, total).lastInsertRowid;
  })();

  res.status(201).json(db.prepare(SELECT + ' WHERE b.id = ?').get(result));
}));

// Admin: semua transisi. Pemilik pemesanan: hanya boleh membatalkan.
r.patch('/:id/status', requireAuth, wrap((req, res) => {
  requireFields(req.body, ['status']);
  const cur = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!cur) throw new HttpError(404, 'Pemesanan tidak ditemukan');
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && cur.user_id !== req.user.id) {
    throw new HttpError(403, 'Anda tidak berhak mengubah pemesanan ini');
  }
  if (!(req.body.status in TRANSITIONS)) throw new HttpError(400, 'Status tidak dikenal');
  if (!isAdmin && req.body.status !== 'cancelled') {
    throw new HttpError(403, 'Anda hanya dapat membatalkan pemesanan');
  }
  if (!TRANSITIONS[cur.status].includes(req.body.status)) {
    throw new HttpError(409, `Tidak bisa mengubah status dari ${cur.status} ke ${req.body.status}`);
  }
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(req.body.status, cur.id);
  res.json(db.prepare(SELECT + ' WHERE b.id = ?').get(cur.id));
}));

export default r;
