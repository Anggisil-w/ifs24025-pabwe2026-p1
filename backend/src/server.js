import app from './app.js';
import { seedIfEmpty } from './db.js';
import { ensureDefaultAdmin } from './auth.js';

if (seedIfEmpty()) console.log('Database kosong, data contoh dimasukkan.');

ensureDefaultAdmin();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API berjalan di http://localhost:${PORT}`));
