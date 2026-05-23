const Database = require('better-sqlite3');
const db = new Database('kombat_moto.db');

try {
  const sales = db.prepare("SELECT * FROM sales WHERE id = '09UVTBE7A'").all();
  console.log("=== SALES ===");
  console.log(JSON.stringify(sales, null, 2));

  const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = '09UVTBE7A'").all();
  console.log("=== SALE ITEMS ===");
  console.log(JSON.stringify(items, null, 2));
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
