import Database from 'better-sqlite3';
const db = new Database('./kombat_moto_backup.db');
try {
  const users = db.prepare('SELECT * FROM users').all();
  console.log('Users:', users);
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log('User count:', userCount);
} catch (e) {
  console.error('Error:', e);
}
db.close();
