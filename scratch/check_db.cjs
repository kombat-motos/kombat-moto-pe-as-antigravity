const Database = require('better-sqlite3');
const db = new Database('kombat_moto_backup.db');

try {
  const sales = db.prepare("SELECT * FROM sales ORDER BY date DESC LIMIT 3").all();
  console.log("=== LATEST 3 SALES ===");
  console.log(JSON.stringify(sales, null, 2));

  for (const sale of sales) {
    const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(sale.id);
    console.log(`=== ITEMS FOR SALE ${sale.id} ===`);
    console.log(JSON.stringify(items, null, 2));
  }
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
