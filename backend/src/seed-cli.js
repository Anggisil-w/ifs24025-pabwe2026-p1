import { seedIfEmpty } from './db.js';
console.log(seedIfEmpty() ? 'Data contoh dimasukkan.' : 'Database sudah berisi data, seed dilewati.');
