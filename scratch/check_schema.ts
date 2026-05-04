import Database from 'better-sqlite3';
const db = new Database('./kombat_moto_backup.db');
try {
  const columns = db.prepare('PRAGMA table_info(customers)').all();
  console.log('Customers columns:', columns);
  const quoteColumns = db.prepare('PRAGMA table_info(quotes)').all();
  console.log('Quotes columns:', quoteColumns);
} catch (e) {
  console.error('Error:', e);
}
db.close();
