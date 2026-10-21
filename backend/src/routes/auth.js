import { Router } from 'express';
import { db } from '../db.js';
import { HttpError, wrap, requireFields } from '../util.js';
import { hashPassword, checkPassword, signToken, requireAuth } from '../auth.js';

const r = Router();
const publicUser = (u) => ({ id: u.id, nama: u.nama, email: u.email, role: u.role });

r.post('/register', wrap((req, res) => {
  requireFields(req.body, ['nama', 'email', 'password']);
  const { nama, email, password } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Format email tidak valid');
  if (String(password).length < 6) throw new HttpError(400, 'Password minimal 6 karakter');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw new HttpError(409, 'Email sudah terdaftar');
  }
  const id = db.prepare("INSERT INTO users (nama, email, password_hash, role) VALUES (?,?,?, 'tamu')")
    .run(nama, email, hashPassword(String(password))).lastInsertRowid;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

r.post('/login', wrap((req, res) => {
  requireFields(req.body, ['email', 'password']);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email);
  if (!user || !checkPassword(String(req.body.password), user.password_hash)) {
    throw new HttpError(401, 'Email atau password salah');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

r.get('/me', requireAuth, wrap((req, res) => res.json({ user: req.user })));

export default r;
