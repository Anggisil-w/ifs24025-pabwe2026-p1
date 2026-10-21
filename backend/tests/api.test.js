import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
const { default: app } = await import('../src/app.js');
const { seedIfEmpty } = await import('../src/db.js');
const { ensureDefaultAdmin } = await import('../src/auth.js');

let server;
let base;
let admin; // token admin
let tamu; // token tamu
let tamuId;

const call = async (path, method = 'GET', body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
};

before(async () => {
  seedIfEmpty();
  ensureDefaultAdmin();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}`;
  admin = (await call('/api/auth/login', 'POST', { email: 'admin@homestay.local', password: 'admin123' })).data.token;
});
after(() => server.close());

// ---------- Autentikasi ----------
test('register tamu, login, dan /auth/me', async () => {
  const reg = await call('/api/auth/register', 'POST', { nama: 'Tamu Satu', email: 'tamu1@example.com', password: 'rahasia1' });
  assert.equal(reg.status, 201);
  assert.equal(reg.data.user.role, 'tamu');
  assert.equal(reg.data.user.password_hash, undefined);
  const login = await call('/api/auth/login', 'POST', { email: 'tamu1@example.com', password: 'rahasia1' });
  assert.equal(login.status, 200);
  tamu = login.data.token;
  tamuId = login.data.user.id;
  const me = await call('/api/auth/me', 'GET', null, tamu);
  assert.equal(me.data.user.email, 'tamu1@example.com');
});

test('login gagal: password salah, email ganda, password pendek', async () => {
  assert.equal((await call('/api/auth/login', 'POST', { email: 'tamu1@example.com', password: 'salah' })).status, 401);
  assert.equal((await call('/api/auth/register', 'POST', { nama: 'X', email: 'tamu1@example.com', password: 'rahasia1' })).status, 409);
  assert.equal((await call('/api/auth/register', 'POST', { nama: 'X', email: 'x@example.com', password: '123' })).status, 400);
  assert.equal((await call('/api/auth/me')).status, 401);
  assert.equal((await call('/api/auth/me', 'GET', null, 'token.palsu.xyz')).status, 401);
});

test('hak akses: endpoint admin menolak tanpa token dan tamu biasa', async () => {
  assert.equal((await call('/api/bookings')).status, 401);
  assert.equal((await call('/api/bookings', 'GET', null, tamu)).status, 403);
  assert.equal((await call('/api/homestays', 'POST', { nama: 'A', alamat: 'B', kota: 'C' }, tamu)).status, 403);
  assert.equal((await call('/api/guests', 'GET', null, tamu)).status, 403);
  assert.equal((await call('/api/bookings', 'GET', null, admin)).status, 200);
});

// ---------- Data publik ----------
test('GET /api/homestays publik mengembalikan data seed', async () => {
  const { status, data } = await call('/api/homestays');
  assert.equal(status, 200);
  assert.ok(data.length >= 3);
  assert.ok('rata_rating' in data[0]);
});

// ---------- Pemesanan ----------
test('pemesanan wajib login', async () => {
  const { status } = await call('/api/bookings', 'POST', {
    room_id: 3, check_in: '2026-12-01', check_out: '2026-12-04', jumlah_tamu: 2
  });
  assert.equal(status, 401);
});

test('tamu memesan: data tamu dari akun, total_harga otomatis', async () => {
  const { status, data } = await call('/api/bookings', 'POST', {
    room_id: 3, check_in: '2026-12-01', check_out: '2026-12-04', jumlah_tamu: 2, telepon: '0812'
  }, tamu);
  assert.equal(status, 201);
  assert.equal(data.total_harga, 3 * 200000);
  assert.equal(data.status, 'pending');
  assert.equal(data.email_tamu, 'tamu1@example.com');
  assert.equal(data.user_id, tamuId);
});

test('pemesanan bentrok tanggal ditolak (409)', async () => {
  const { status } = await call('/api/bookings', 'POST', {
    room_id: 3, check_in: '2026-12-03', check_out: '2026-12-06', jumlah_tamu: 1
  }, tamu);
  assert.equal(status, 409);
});

test('check_out = check_in booking lain tidak bentrok', async () => {
  const { status } = await call('/api/bookings', 'POST', {
    room_id: 3, check_in: '2026-12-04', check_out: '2026-12-05', jumlah_tamu: 1
  }, tamu);
  assert.equal(status, 201);
});

test('kamar yang bentrok tidak muncul di /rooms/available', async () => {
  const { data } = await call('/api/rooms/available?check_in=2026-12-02&check_out=2026-12-03&kapasitas=1');
  assert.ok(!data.some((r) => r.id === 3));
  assert.ok(data.length > 0);
});

test('jumlah tamu melebihi kapasitas ditolak', async () => {
  const { status } = await call('/api/bookings', 'POST', {
    room_id: 5, check_in: '2027-01-01', check_out: '2027-01-02', jumlah_tamu: 4
  }, tamu);
  assert.equal(status, 400);
});

test('/bookings/mine hanya milik sendiri; detail milik orang lain ditolak', async () => {
  const mine = await call('/api/bookings/mine', 'GET', null, tamu);
  assert.equal(mine.status, 200);
  assert.ok(mine.data.length >= 2 && mine.data.every((b) => b.user_id === tamuId));

  const other = (await call('/api/auth/register', 'POST', { nama: 'Tamu Dua', email: 'tamu2@example.com', password: 'rahasia2' })).data.token;
  assert.equal((await call(`/api/bookings/${mine.data[0].id}`, 'GET', null, other)).status, 403);
  assert.equal((await call(`/api/bookings/${mine.data[0].id}`, 'GET', null, tamu)).status, 200);
  assert.equal((await call(`/api/bookings/${mine.data[0].id}/status`, 'PATCH', { status: 'cancelled' }, other)).status, 403);
});

test('tamu hanya boleh membatalkan, tidak boleh konfirmasi', async () => {
  const b = await call('/api/bookings', 'POST', {
    room_id: 4, check_in: '2027-03-01', check_out: '2027-03-02', jumlah_tamu: 1
  }, tamu);
  const id = b.data.id;
  assert.equal((await call(`/api/bookings/${id}/status`, 'PATCH', { status: 'confirmed' }, tamu)).status, 403);
  const c = await call(`/api/bookings/${id}/status`, 'PATCH', { status: 'cancelled' }, tamu);
  assert.equal(c.status, 200);
  assert.equal(c.data.status, 'cancelled');
});

test('alur admin: pending -> confirmed -> completed, lalu tamu mengulas', async () => {
  const b = await call('/api/bookings', 'POST', {
    room_id: 6, check_in: '2027-02-01', check_out: '2027-02-02', jumlah_tamu: 1
  }, tamu);
  const id = b.data.id;
  assert.equal((await call(`/api/bookings/${id}/status`, 'PATCH', { status: 'completed' }, admin)).status, 409);
  assert.equal((await call(`/api/bookings/${id}/status`, 'PATCH', { status: 'confirmed' }, admin)).status, 200);
  assert.equal((await call(`/api/bookings/${id}/status`, 'PATCH', { status: 'completed' }, admin)).status, 200);
  assert.equal((await call('/api/reviews', 'POST', { booking_id: id, rating: 4 })).status, 401);
  const rv = await call('/api/reviews', 'POST', { booking_id: id, rating: 4, komentar: 'Bagus' }, tamu);
  assert.equal(rv.status, 201);
  assert.equal((await call('/api/reviews', 'POST', { booking_id: id, rating: 4 }, tamu)).status, 409);
});

// ---------- CRUD admin ----------
test('CRUD homestay oleh admin dan validasi field wajib', async () => {
  assert.equal((await call('/api/homestays', 'POST', { nama: 'X' }, admin)).status, 400);
  const c = await call('/api/homestays', 'POST', { nama: 'Baru', alamat: 'Jl. A', kota: 'Medan' }, admin);
  assert.equal(c.status, 201);
  const u = await call(`/api/homestays/${c.data.id}`, 'PUT', { nama: 'Baru 2' }, admin);
  assert.equal(u.data.nama, 'Baru 2');
  assert.equal((await call(`/api/homestays/${c.data.id}`, 'DELETE', null, admin)).status, 204);
  assert.equal((await call(`/api/homestays/${c.data.id}`)).status, 404);
});
