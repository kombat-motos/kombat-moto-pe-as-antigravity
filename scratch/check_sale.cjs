const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../kombat_moto.db');
console.log('Connecting to database:', dbPath);
const db = new Database(dbPath);

try {
  const saleId = '09UVTBE7A';
  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId);
  console.log('SALE:', sale);

  const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(saleId);
  console.log('ITEMS:', items);
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
