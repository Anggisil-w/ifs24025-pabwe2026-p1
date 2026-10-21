import { Router } from 'express';
import { db } from '../db.js';
import { HttpError, wrap, requireFields } from '../util.js';
import { requireAuth, requireAdmin } from '../auth.js';

export const facilities = Router();
facilities.get('/', wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM facilities ORDER BY nama').all());
}));

export const guests = Router();
guests.get('/', requireAdmin, wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM guests ORDER BY id DESC').all());
}));
guests.post('/', requireAdmin, wrap((req, res) => {
  requireFields(req.body, ['nama', 'email']);
  const { nama, email, telepon = null } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Format email tidak valid');
  if (db.prepare('SELECT 1 FROM guests WHERE email = ?').get(email)) {
    throw new HttpError(409, 'Email sudah terdaftar');
  }
  const id = db.prepare('INSERT INTO guests (nama, email, telepon) VALUES (?,?,?)')
    .run(nama, email, telepon).lastInsertRowid;
  res.status(201).json(db.prepare('SELECT * FROM guests WHERE id = ?').get(id));
}));

export const reviews = Router();
reviews.get('/', wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all());
}));
reviews.post('/', requireAuth, wrap((req, res) => {
  requireFields(req.body, ['booking_id', 'rating']);
  const { booking_id, rating, komentar = null } = req.body;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'Rating harus bilangan bulat 1-5');
  }
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!b) throw new HttpError(404, 'Pemesanan tidak ditemukan');
  if (req.user.role !== 'admin' && b.user_id !== req.user.id) {
    throw new HttpError(403, 'Anda hanya bisa mengulas pemesanan milik sendiri');
  }
  if (b.status !== 'completed') throw new HttpError(409, 'Ulasan hanya untuk pemesanan berstatus completed');
  if (db.prepare('SELECT 1 FROM reviews WHERE booking_id = ?').get(booking_id)) {
    throw new HttpError(409, 'Pemesanan ini sudah diulas');
  }
  const id = db.prepare('INSERT INTO reviews (booking_id, rating, komentar) VALUES (?,?,?)')
    .run(booking_id, rating, komentar).lastInsertRowid;
  res.status(201).json(db.prepare('SELECT * FROM reviews WHERE id = ?').get(id));
}));
