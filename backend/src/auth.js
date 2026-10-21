import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { HttpError } from './util.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-ganti-di-produksi';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('PERINGATAN: JWT_SECRET belum diset. Set variabel ini di hosting!');
}

export const hashPassword = (pw) => bcrypt.hashSync(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compareSync(pw, hash);
export const signToken = (u) => jwt.sign({ sub: u.id, role: u.role }, SECRET, { expiresIn: '7d' });

/** Membaca token Bearer (jika ada) dan mengisi req.user. Tidak menolak request. */
export function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, SECRET);
      const u = db.prepare('SELECT id, nama, email, role FROM users WHERE id = ?').get(payload.sub);
      if (u) req.user = { ...u };
    } catch {
      /* token tidak valid/kedaluwarsa: anggap belum login */
    }
  }
  next();
}

export const requireAuth = (req, res, next) =>
  req.user ? next() : next(new HttpError(401, 'Silakan login terlebih dahulu'));

export const requireAdmin = (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Silakan login terlebih dahulu'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'Hanya admin yang boleh mengakses'));
  next();
};

/** Buat akun admin awal jika belum ada admin. */
export function ensureDefaultAdmin() {
  const ada = db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
  if (ada) return false;
  const email = process.env.ADMIN_EMAIL || 'admin@homestay.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  db.prepare("INSERT INTO users (nama, email, password_hash, role) VALUES (?,?,?, 'admin')")
    .run('Admin Homestay', email, hashPassword(password));
  console.log(`Akun admin dibuat: ${email} (password dari ADMIN_PASSWORD / default)`);
  return true;
}
