import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("kombat_moto.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cpf TEXT,
    whatsapp TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    zip_code TEXT
  );

  CREATE TABLE IF NOT EXISTS motorcycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    plate TEXT NOT NULL,
    model TEXT NOT NULL,
    current_km INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT,
    purchase_price REAL DEFAULT 0,
    sale_price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'Unitário'
  );

  CREATE TABLE IF NOT EXISTS credit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    original_value REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'Aberto',
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id)
  );

  CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cnpj_cpf TEXT,
    telefone TEXT,
    email TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contas_pagar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_lancamento TEXT NOT NULL,
    fornecedor_id INTEGER,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor REAL NOT NULL,
    data_compra TEXT,
    data_vencimento TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    forma_pagamento TEXT,
    parcelas INTEGER DEFAULT 1,
    parcela_atual INTEGER DEFAULT 1,
    arquivo_boleto_url TEXT,
    comprovante_url TEXT,
    data_pagamento TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
  );

  CREATE TABLE IF NOT EXISTS cash_sessions (
    id TEXT PRIMARY KEY,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    opening_balance REAL DEFAULT 0,
    closing_balance REAL,
    expected_balance REAL,
    status TEXT DEFAULT 'Aberto',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS cash_transactions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES cash_sessions (id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Serve uploads dir
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Multer config
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  });
  const upload = multer({ storage });

  // Helper to calculate interest
  const calculateCreditUpdate = (item: any) => {
    if (item.status === 'Pago') return { ...item, total_updated: item.original_value, fine: 0, interest: 0, days_late: 0 };
    
    const dueDate = new Date(item.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (today > dueDate) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const fine = item.original_value * 0.02;
      const interest = item.original_value * (0.00033 * diffDays);
      const totalUpdated = item.original_value + fine + interest;
      
      return {
        ...item,
        status: 'Atrasado',
        fine,
        interest,
        days_late: diffDays,
        total_updated: totalUpdated
      };
    }
    
    return { ...item, total_updated: item.original_value, fine: 0, interest: 0, days_late: 0 };
  };

  // API Routes
  
  // Customers
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers").all();
    res.json(customers);
  });

  app.post("/api/customers", (req, res) => {
    const { name, cpf, whatsapp, address, neighborhood, zip_code } = req.body;
    const info = db.prepare("INSERT INTO customers (name, cpf, whatsapp, address, neighborhood, zip_code) VALUES (?, ?, ?, ?, ?, ?)").run(name, cpf, whatsapp, address, neighborhood, zip_code);
    res.json({ id: info.lastInsertRowid });
  });

  // Motorcycles
  app.get("/api/motorcycles", (req, res) => {
    const motorcycles = db.prepare(`
      SELECT m.*, c.name as customer_name 
      FROM motorcycles m 
      JOIN customers c ON m.customer_id = c.id
    `).all();
    res.json(motorcycles);
  });

  app.post("/api/motorcycles", (req, res) => {
    const { customer_id, plate, model, current_km } = req.body;
    const info = db.prepare("INSERT INTO motorcycles (customer_id, plate, model, current_km) VALUES (?, ?, ?, ?)").run(customer_id, plate, model, current_km);
    res.json({ id: info.lastInsertRowid });
  });

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { description, sku, barcode, purchase_price, sale_price, stock, unit } = req.body;
    const info = db.prepare("INSERT INTO products (description, sku, barcode, purchase_price, sale_price, stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?)").run(description, sku, barcode, purchase_price, sale_price, stock, unit);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/products/:id", (req, res) => {
    const { description, sku, barcode, purchase_price, sale_price, stock, unit } = req.body;
    db.prepare("UPDATE products SET description = ?, sku = ?, barcode = ?, purchase_price = ?, sale_price = ?, stock = ?, unit = ? WHERE id = ?")
      .run(description, sku, barcode, purchase_price, sale_price, stock, unit, req.params.id);
    res.json({ success: true });
  });

  // Credit
  app.get("/api/credit", (req, res) => {
    const creditItems = db.prepare(`
      SELECT cr.*, c.name as customer_name, c.whatsapp, c.neighborhood
      FROM credit cr
      JOIN customers c ON cr.customer_id = c.id
    `).all();
    
    const updatedItems = creditItems.map(calculateCreditUpdate);
    res.json(updatedItems);
  });

  app.post("/api/credit", (req, res) => {
    const { customer_id, original_value, due_date } = req.body;
    const info = db.prepare("INSERT INTO credit (customer_id, original_value, due_date) VALUES (?, ?, ?)").run(customer_id, original_value, due_date);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/credit/:id/pay", (req, res) => {
    db.prepare("UPDATE credit SET status = 'Pago' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", (req, res) => {
    const monthlyRevenue = db.prepare("SELECT SUM(sale_price * quantity) as total FROM sales s JOIN products p ON s.product_id = p.id WHERE strftime('%m', sale_date) = strftime('%m', 'now')").get();
    
    const creditItems = db.prepare("SELECT * FROM credit WHERE status != 'Pago'").all();
    const updatedCredit = creditItems.map(calculateCreditUpdate);
    const delinquency = updatedCredit.filter(i => i.status === 'Atrasado').reduce((acc, curr) => acc + curr.original_value, 0);
    
    const openServiceOrders = db.prepare("SELECT COUNT(*) as count FROM motorcycles WHERE current_km % 3000 > 2500").get(); // Mock logic for "revisão próxima"
    
    const topProducts = db.prepare(`
      SELECT p.description, SUM(s.quantity) as total_sold 
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      GROUP BY p.id 
      ORDER BY total_sold DESC 
      LIMIT 5
    `).all();

    res.json({
      revenue: monthlyRevenue.total || 0,
      delinquency: delinquency,
      openServiceOrders: openServiceOrders.count,
      topProducts: topProducts
    });
  });

  // Fornecedores
  app.get("/api/fornecedores", (req, res) => {
    const fornecedores = db.prepare("SELECT * FROM fornecedores ORDER BY nome").all();
    res.json(fornecedores);
  });

  app.post("/api/fornecedores", (req, res) => {
    const { nome, cnpj_cpf, telefone, email } = req.body;
    const info = db.prepare("INSERT INTO fornecedores (nome, cnpj_cpf, telefone, email) VALUES (?, ?, ?, ?)").run(nome, cnpj_cpf, telefone, email);
    res.json({ id: info.lastInsertRowid });
  });

  // Contas a Pagar
  app.get("/api/contas-pagar", (req, res) => {
    const contas = db.prepare(`
      SELECT c.*, f.nome as fornecedor_nome 
      FROM contas_pagar c 
      LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
      ORDER BY c.data_vencimento ASC
    `).all();
    res.json(contas);
  });

  app.post("/api/contas-pagar", upload.single('arquivo_boleto'), (req, res) => {
    const {
      tipo_lancamento, fornecedor_id, descricao, categoria, valor, 
      data_compra, data_vencimento, forma_pagamento, parcelas, observacoes
    } = req.body;
    
    const arquivo_boleto_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const info = db.prepare(`
      INSERT INTO contas_pagar (
        tipo_lancamento, fornecedor_id, descricao, categoria, valor, 
        data_compra, data_vencimento, forma_pagamento, parcelas, observacoes, arquivo_boleto_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tipo_lancamento, fornecedor_id || null, descricao, categoria, parseFloat(valor),
      data_compra || null, data_vencimento, forma_pagamento || null, parseInt(parcelas) || 1, observacoes || null, arquivo_boleto_url
    );
    
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/contas-pagar/:id/pay", upload.single('comprovante'), (req, res) => {
    const { data_pagamento, forma_pagamento } = req.body;
    const comprovante_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Build update query dynamically in case no file is uploaded
    let query = "UPDATE contas_pagar SET status = 'pago', data_pagamento = ?, forma_pagamento = ?";
    let params: any[] = [data_pagamento, forma_pagamento];
    
    if (comprovante_url) {
      query += ", comprovante_url = ?";
      params.push(comprovante_url);
    }
    
    query += " WHERE id = ?";
    params.push(req.params.id);
    
    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.delete("/api/contas-pagar/:id", (req, res) => {
    db.prepare("DELETE FROM contas_pagar WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Fluxo de Caixa (Cash Sessions)
  app.get("/api/cash_sessions", (req, res) => {
    const sessions = db.prepare("SELECT * FROM cash_sessions ORDER BY opened_at DESC").all();
    res.json(sessions);
  });

  app.post("/api/cash_sessions", (req, res) => {
    const { id, opened_at, opening_balance, status, notes } = req.body;
    db.prepare("INSERT INTO cash_sessions (id, opened_at, opening_balance, status, notes) VALUES (?, ?, ?, ?, ?)").run(
      id, opened_at, opening_balance, status, notes
    );
    res.json({ id });
  });

  app.put("/api/cash_sessions/:id", (req, res) => {
    const { closed_at, closing_balance, expected_balance, status } = req.body;
    db.prepare("UPDATE cash_sessions SET closed_at = ?, closing_balance = ?, expected_balance = ?, status = ? WHERE id = ?").run(
      closed_at, closing_balance, expected_balance, status, req.params.id
    );
    res.json({ success: true });
  });

  // Cash Transactions
  app.get("/api/cash_transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM cash_transactions ORDER BY date ASC").all();
    res.json(transactions);
  });

  app.post("/api/cash_transactions", (req, res) => {
    const { id, session_id, type, amount, description, date } = req.body;
    db.prepare("INSERT INTO cash_transactions (id, session_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, session_id, type, amount, description, date
    );
    res.json({ id });
  });

  // Seed data if empty
  const customerCount = db.prepare("SELECT COUNT(*) as count FROM customers").get();
  if (customerCount.count === 0) {
    const custId = db.prepare("INSERT INTO customers (name, cpf, whatsapp, address, neighborhood, zip_code) VALUES (?, ?, ?, ?, ?, ?)").run(
      "João Silva", "000.000.000-00", "5511999999999", "Rua das Flores, 123", "", "01001-000"
    ).lastInsertRowid;
    
    db.prepare("INSERT INTO motorcycles (customer_id, plate, model, current_km) VALUES (?, ?, ?, ?)").run(
      custId, "ABC-1234", "Honda CB 500", 12500
    );
    
    db.prepare("INSERT INTO products (description, sku, barcode, purchase_price, sale_price, stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      "Óleo Motul 5100", "MOT-5100", "7891234567890", 45.00, 65.00, 20, "Unitário"
    );
    
    db.prepare("INSERT INTO credit (customer_id, original_value, due_date) VALUES (?, ?, ?)").run(
      custId, 150.00, "2024-01-01" // Overdue
    );
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
