import express from 'express';
import cors from 'cors';
import homestays from './routes/homestays.js';
import rooms from './routes/rooms.js';
import bookings from './routes/bookings.js';
import authRoutes from './routes/auth.js';
import { authenticate } from './auth.js';
import { facilities, guests, reviews } from './routes/misc.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(authenticate);

app.get('/', (req, res) => res.json({ app: 'Homestay API', status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/homestays', homestays);
app.use('/api', rooms);
app.use('/api/bookings', bookings);
app.use('/api/guests', guests);
app.use('/api/reviews', reviews);
app.use('/api/facilities', facilities);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'JSON tidak valid' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Kesalahan server' : err.message });
});

export default app;
