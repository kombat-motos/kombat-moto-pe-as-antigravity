import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import fs from "fs";
import * as XLSX from "xlsx";
import cors from 'cors';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "kombat-moto-secret-key-2024";

const dbPath = process.env.DB_PATH || "./kombat_moto_backup.db";
const db = new Database(dbPath);

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string };
    }
  }
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cpf TEXT,
    whatsapp TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    zip_code TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS motorcycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    plate TEXT NOT NULL,
    model TEXT NOT NULL,
    current_km INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    purchase_price REAL DEFAULT 0,
    sale_price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'Unitário',
    category TEXT,
    image_url TEXT,
    application TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS mechanics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    commission_rate REAL DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS fixed_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    payout REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    customer_id INTEGER,
    customer_name TEXT,
    labor_value REAL DEFAULT 0,
    commission REAL DEFAULT 0,
    mechanic_id INTEGER,
    total REAL NOT NULL,
    payment_method TEXT,
    payment_status TEXT,
    due_date TEXT,
    paid_date TEXT,
    type TEXT DEFAULT 'Balcão',
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id),
    FOREIGN KEY (mechanic_id) REFERENCES mechanics (id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id TEXT NOT NULL,
    product_id INTEGER,
    description TEXT,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    type TEXT DEFAULT 'Peça',
    FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    customer_id INTEGER,
    motorcycle_details TEXT,
    total_value REAL NOT NULL,
    observations TEXT,
    warranty_terms TEXT,
    validity_days INTEGER DEFAULT 7,
    status TEXT DEFAULT 'Pendente',
    items TEXT, -- Stored as JSON string
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    whatsapp TEXT,
    interest TEXT,
    status TEXT DEFAULT 'Novo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS distributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    whatsapp TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    distributor_id INTEGER,
    total_value REAL DEFAULT 0,
    status TEXT DEFAULT 'Pendente',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (distributor_id) REFERENCES distributors (id)
  );

  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    description TEXT,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    opening_balance REAL DEFAULT 0,
    closing_balance REAL,
    status TEXT DEFAULT 'Aberto',
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS cash_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    type TEXT, -- 'Entrada' or 'Saída'
    amount REAL NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (session_id) REFERENCES cash_sessions (id)
  );

  CREATE TABLE IF NOT EXISTS registered_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS credit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    original_value REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'Aberto',
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  CREATE TABLE IF NOT EXISTS short_links (
    code TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration scripts for missing columns
const migrations = [
  "ALTER TABLE sales ADD COLUMN moto_details TEXT",
  "ALTER TABLE sales ADD COLUMN service_description TEXT",
  "ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Concluído'",
  "ALTER TABLE sales ADD COLUMN paid_total REAL DEFAULT 0",
  "ALTER TABLE sales ADD COLUMN customer_id INTEGER",
  "ALTER TABLE sales ADD COLUMN customer_name TEXT",
  "ALTER TABLE sales ADD COLUMN labor_value REAL DEFAULT 0",
  "ALTER TABLE sales ADD COLUMN commission REAL DEFAULT 0",
  "ALTER TABLE sales ADD COLUMN mechanic_id INTEGER",
  "ALTER TABLE sales ADD COLUMN total REAL DEFAULT 0",
  "ALTER TABLE sales ADD COLUMN payment_method TEXT",
  "ALTER TABLE sales ADD COLUMN payment_status TEXT",
  "ALTER TABLE sales ADD COLUMN due_date TEXT",
  "ALTER TABLE sales ADD COLUMN paid_date TEXT",
  "ALTER TABLE sales ADD COLUMN type TEXT",
  "ALTER TABLE sales ADD COLUMN date TEXT",
  "ALTER TABLE sales ADD COLUMN motorcycle_id INTEGER",
  "ALTER TABLE sales ADD COLUMN motorcycle_km INTEGER",
  "ALTER TABLE sales ADD COLUMN whatsapp TEXT",
  "ALTER TABLE sale_items ADD COLUMN type TEXT DEFAULT 'Peça'",
  "ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT 1",
  "ALTER TABLE products ADD COLUMN image_url2 TEXT",
  "ALTER TABLE products ADD COLUMN image_url3 TEXT",
  "ALTER TABLE products ADD COLUMN image_url4 TEXT",
  "ALTER TABLE products ADD COLUMN brand TEXT",
  "ALTER TABLE products ADD COLUMN location TEXT",
  "ALTER TABLE products ADD COLUMN application TEXT",
  "ALTER TABLE products ADD COLUMN category TEXT",
  "ALTER TABLE customers ADD COLUMN nickname TEXT",
  "ALTER TABLE customers ADD COLUMN cnpj TEXT",
  "ALTER TABLE registered_services ADD COLUMN category TEXT",
  "ALTER TABLE quotes ADD COLUMN motorcycle_details TEXT",
  "ALTER TABLE quotes ADD COLUMN customer_id INTEGER",
  "ALTER TABLE quotes ADD COLUMN customer_name TEXT",
  "ALTER TABLE quotes ADD COLUMN items TEXT",
  "ALTER TABLE leads ADD COLUMN company TEXT",
  "ALTER TABLE leads ADD COLUMN value REAL DEFAULT 0",
  "ALTER TABLE leads ADD COLUMN priority TEXT DEFAULT 'Média'",
  "ALTER TABLE leads ADD COLUMN phone TEXT",
  "ALTER TABLE leads ADD COLUMN name TEXT"
];

migrations.forEach(m => {
  try { db.exec(m); } catch (e) {}
});
try { db.exec("UPDATE leads SET name = customer_name WHERE name IS NULL"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN city TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN fine_rate REAL DEFAULT 2"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN interest_rate REAL DEFAULT 1"); } catch (e) {}
try { db.exec("ALTER TABLE mechanics ADD COLUMN commission_rate REAL DEFAULT 0"); } catch (e) {}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  app.use(cookieParser());

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

  // Authentication Middleware - Bypass for local standalone mode
  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // For local standalone mode, we automatically assign a default user
    req.user = { id: 1, username: 'admin' };
    next();
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Usuário e senha obrigatórios" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: "Usuário já existe" });
      }
      res.status(500).json({ error: "Erro ao registrar" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth_token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json(req.user);
  });

  // API Routes (Protected)

  // Generic Get All
  const defineGenericRoutes = (table: string, route: string) => {
    app.get(`/api/${route}`, authenticateToken, (req, res) => {
      const data = db.prepare(`SELECT * FROM ${table} WHERE user_id = ?`).all(req.user!.id);
      res.json(data);
    });
    app.delete(`/api/${route}/:id`, authenticateToken, (req, res) => {
      db.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`).run(req.params.id, req.user!.id);
      res.json({ success: true });
    });
  };

  // Specific Routes & CRUD
  
  // Customers
  app.get("/api/customers", authenticateToken, (req, res) => {
    const customers = db.prepare("SELECT * FROM customers WHERE user_id = ? ORDER BY name ASC").all(req.user!.id);
    res.json(customers);
  });
  app.post("/api/customers", authenticateToken, (req, res) => {
    const { name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit, fine_rate, interest_rate } = req.body;
    const info = db.prepare("INSERT INTO customers (user_id, name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit, fine_rate, interest_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(req.user!.id, name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit || 0, fine_rate || 2, interest_rate || 1);
    res.json({ id: parseInt(info.lastInsertRowid.toString()) });
  });

  app.put("/api/customers/:id", authenticateToken, (req, res) => {
    const { name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit, fine_rate, interest_rate } = req.body;
    db.prepare(`
      UPDATE customers 
      SET name = ?, nickname = ?, cpf = ?, cnpj = ?, whatsapp = ?, address = ?, neighborhood = ?, city = ?, zip_code = ?, credit_limit = ?, fine_rate = ?, interest_rate = ? 
      WHERE id = ? AND user_id = ?
    `).run(name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit || 0, fine_rate || 2, interest_rate || 1, req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Motorcycles
  app.get("/api/motorcycles", authenticateToken, (req, res) => {
    const motorcycles = db.prepare(`SELECT m.*, c.name as customer_name FROM motorcycles m LEFT JOIN customers c ON m.customer_id = c.id WHERE m.user_id = ?`).all(req.user!.id);
    res.json(motorcycles);
  });
  app.post("/api/motorcycles", authenticateToken, (req, res) => {
    const { customer_id, plate, model, current_km } = req.body;
    const info = db.prepare("INSERT INTO motorcycles (user_id, customer_id, plate, model, current_km) VALUES (?, ?, ?, ?, ?)").run(req.user!.id, customer_id, plate, model, current_km);
    res.json({ id: parseInt(info.lastInsertRowid.toString()) });
  });
  app.put("/api/motorcycles/:id", authenticateToken, (req, res) => {
    const { customer_id, plate, model, current_km } = req.body;
    db.prepare("UPDATE motorcycles SET customer_id = ?, plate = ?, model = ?, current_km = ? WHERE id = ? AND user_id = ?").run(customer_id, plate, model, current_km, req.params.id, req.user!.id);
    res.json({ success: true });
  });
  app.delete("/api/motorcycles/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM motorcycles WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", authenticateToken, (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE user_id = ? ORDER BY description ASC").all(req.user!.id);
    res.json(products);
  });
  app.post("/api/products", authenticateToken, (req, res) => {
    try {
      const { description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location } = req.body;
      const info = db.prepare("INSERT INTO products (user_id, description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(req.user!.id, description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location);
      res.json({ id: parseInt(info.lastInsertRowid.toString()) });
    } catch (err: any) {
      console.error('ERRO AO SALVAR PRODUTO:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/export-products", authenticateToken, (req, res) => {
    try {
      const products = db.prepare("SELECT * FROM products WHERE user_id = ? ORDER BY description ASC").all(req.user!.id) as any[];
      
      const data = products.map(p => ({
        'ID': p.id,
        'Descrição': p.description,
        'SKU': p.sku || '',
        'EAN': p.barcode || '',
        'Marca': p.brand || '',
        'Aplicação': p.application || '',
        'Categoria': p.category || '',
        'Localização': p.location || '',
        'Preço de Compra': p.purchase_price,
        'Preço de Venda': p.sale_price,
        'Estoque': p.stock,
        'Unidade': p.unit || 'Unitário',
        'Imagem': p.image_url || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Produtos");
      
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', `attachment; filename="estoque_kombat_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (err: any) {
      console.error('Erro na exportação:', err);
      res.status(500).json({ error: "Erro ao exportar excel" });
    }
  });

  app.get("/api/export-template", (req, res) => {
    try {
      const data = [{
        'Descrição': 'Ex: Pneu 90/90-18',
        'SKU': 'PNE-001',
        'EAN': '7891234567890',
        'Marca': 'Pirelli',
        'Aplicação': 'CG 150/160',
        'Categoria': 'Pneus',
        'Localização': 'A1-B2',
        'Preço de Compra': 150.00,
        'Preço de Venda': 220.00,
        'Estoque': 10,
        'Unidade': 'Unitário',
        'Imagem': 'https://link-da-imagem.com/foto.jpg'
      }];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao_kombat.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (err: any) {
      console.error('Erro no template:', err);
      res.status(500).json({ error: "Erro ao gerar template" });
    }
  });
  app.put("/api/products/:id", authenticateToken, (req, res) => {
    try {
      const { description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location } = req.body;
      db.prepare("UPDATE products SET description = ?, sku = ?, barcode = ?, purchase_price = ?, sale_price = ?, stock = ?, unit = ?, image_url = ?, image_url2 = ?, image_url3 = ?, image_url4 = ?, brand = ?, application = ?, category = ?, location = ? WHERE id = ? AND user_id = ?")
        .run(description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location, req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      console.error('ERRO AO EDITAR PRODUTO:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post("/api/products/mass-update", authenticateToken, (req, res) => {
    try {
      const { type, action, value, productIds } = req.body;
      const userId = req.user!.id;
      
      const val = parseFloat(value);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ error: "Valor inválido" });
      }

      let query = "";
      if (type === 'percent') {
        const multiplier = action === 'increase' ? (1 + (val / 100)) : (1 - (val / 100));
        query = `UPDATE products SET sale_price = ROUND(sale_price * ${multiplier}, 2) WHERE user_id = ?`;
      } else {
        const sign = action === 'increase' ? '+' : '-';
        query = `UPDATE products SET sale_price = ROUND(sale_price ${sign} ${val}, 2) WHERE user_id = ?`;
      }

      const ids = Array.isArray(productIds) ? productIds : [];

      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        query += ` AND id IN (${placeholders})`;
        db.prepare(query).run(userId, ...ids);
      } else {
        db.prepare(query).run(userId);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('ERRO AO ATUALIZAR EM MASSA:', err);
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/products/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Mechanics
  app.get("/api/mechanics", authenticateToken, (req, res) => {
    const data = db.prepare(`SELECT * FROM mechanics WHERE user_id = ?`).all(req.user!.id);
    res.json(data);
  });
  app.post("/api/mechanics", authenticateToken, (req, res) => {
    const { name, commission_rate, active } = req.body;
    const info = db.prepare("INSERT INTO mechanics (user_id, name, commission_rate, active) VALUES (?, ?, ?, ?)").run(req.user!.id, name, commission_rate || 0, active ? 1 : 0);
    res.json({ id: parseInt(info.lastInsertRowid.toString()) });
  });
  app.put("/api/mechanics/:id", authenticateToken, (req, res) => {
    const { name, commission_rate, active } = req.body;
    db.prepare("UPDATE mechanics SET name = ?, commission_rate = ?, active = ? WHERE id = ? AND user_id = ?").run(name, commission_rate || 0, active ? 1 : 0, req.params.id, req.user!.id);
    res.json({ success: true });
  });
  app.delete("/api/mechanics/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM mechanics WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Sales & Items
  app.get("/api/sales", authenticateToken, (req, res) => {
    const sales = db.prepare("SELECT * FROM sales WHERE user_id = ? ORDER BY date DESC LIMIT 200").all(req.user!.id) as any[];
    const salesWithItems = sales.map(s => {
      const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(s.id);
      return { ...s, sale_items: items };
    });
    res.json(salesWithItems);
  });
  app.post("/api/sales", authenticateToken, (req, res) => {
    const { id, customer_id, customer_name, labor_value, commission, mechanic_id, total, payment_method, payment_status, due_date, paid_date, type, date, moto_details, service_description, status, sale_items, motorcycle_km, motorcycle_id, paid_total } = req.body;
    
    const runTransaction = db.transaction(() => {
      // 1. Insert Sale
      const safeTotal = parseFloat(total);
      const safeLabor = parseFloat(labor_value) || 0;
      const safeCommission = parseFloat(commission) || 0;
      const safePaidTotal = parseFloat(paid_total) || 0;
      const safeKm = parseInt(motorcycle_km) || 0;
      const safeCustId = parseInt(customer_id) || null;
      const safeMechId = parseInt(mechanic_id) || null;
      const safeMotoId = parseInt(motorcycle_id) || null;

      db.prepare("INSERT INTO sales (id, user_id, customer_id, customer_name, labor_value, commission, mechanic_id, total, payment_method, payment_status, due_date, paid_date, type, date, moto_details, service_description, status, paid_total, motorcycle_id, motorcycle_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, req.user!.id, safeCustId, customer_name, safeLabor, safeCommission, safeMechId, safeTotal, payment_method, payment_status, due_date, paid_date, type, date, moto_details, service_description, status, safePaidTotal, safeMotoId, safeKm);
      
      // 2. Insert Items & Update Stock
      const insertItem = db.prepare("INSERT INTO sale_items (sale_id, product_id, description, quantity, price, type) VALUES (?, ?, ?, ?, ?, ?)");
      const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
      if (sale_items) {
        for (const item of sale_items) {
          const safePrice = parseFloat(item.price) || 0;
          const safeQty = parseInt(item.quantity) || 0;
          const safeProdId = item.product_id ? parseInt(item.product_id) : null;
          insertItem.run(id, safeProdId, item.description, safeQty, safePrice, item.type || 'Peça');
          if (safeProdId && item.type === 'Peça') {
            updateStock.run(safeQty, safeProdId);
          }
        }
      }

      // 3. Update Motorcycle KM if provided
      if (motorcycle_id && motorcycle_km) {
        db.prepare("UPDATE motorcycles SET current_km = ? WHERE id = ? AND user_id = ?").run(motorcycle_km, motorcycle_id, req.user!.id);
      }
    });

    try {
      runTransaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error('ERRO AO SALVAR VENDA:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/sales/:id", authenticateToken, (req, res) => {
    const { customer_id, customer_name, labor_value, commission, mechanic_id, total, payment_method, payment_status, due_date, paid_date, status, moto_details, service_description, sale_items, motorcycle_km, motorcycle_id, paid_total } = req.body;
    
    const runTransaction = db.transaction(() => {
      // 1. Update Sale
      db.prepare("UPDATE sales SET customer_id = ?, customer_name = ?, labor_value = ?, commission = ?, total = ?, payment_method = ?, payment_status = ?, due_date = ?, paid_date = ?, status = ?, moto_details = ?, service_description = ?, paid_total = ?, motorcycle_id = ?, motorcycle_km = ? WHERE id = ? AND user_id = ?")
        .run(customer_id, customer_name, labor_value, commission, total, payment_method, payment_status, due_date, paid_date, status, moto_details, service_description, paid_total, motorcycle_id, motorcycle_km, req.params.id, req.user!.id);
      
      // 2. Reversal logic for stock
      const oldItems = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(req.params.id) as any[];
      const updateStockAdd = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
      for(const item of oldItems) {
        if(item.product_id) updateStockAdd.run(item.quantity, item.product_id);
      }

      db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(req.params.id);

      if (sale_items) {
        const insertItem = db.prepare("INSERT INTO sale_items (sale_id, product_id, description, quantity, price, type) VALUES (?, ?, ?, ?, ?, ?)");
        const updateStockSub = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
        for (const item of sale_items) {
          insertItem.run(req.params.id, item.product_id, item.description, item.quantity, item.price, item.type || 'Peça');
          if (item.product_id) updateStockSub.run(item.quantity, item.product_id);
        }
      }

      if (motorcycle_id && motorcycle_km) {
        db.prepare("UPDATE motorcycles SET current_km = ? WHERE id = ? AND user_id = ?").run(motorcycle_km, motorcycle_id, req.user!.id);
      }
    });

    try {
      runTransaction();
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar venda" });
    }
  });

  app.delete("/api/sales/:id", authenticateToken, (req, res) => {
    const runTransaction = db.transaction(() => {
      // 1. Reversal stock
      const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(req.params.id) as any[];
      const updateStock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
      for(const item of items) {
        if(item.product_id) updateStock.run(item.quantity, item.product_id);
      }
      // 2. Delete
      db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(req.params.id);
      db.prepare("DELETE FROM sales WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    });
    try {
      runTransaction();
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir venda" });
    }
  });

  app.patch("/api/sales/:id/partial-payment", authenticateToken, (req, res) => {
    const { paid_total, payment_status, paid_date } = req.body;
    try {
      db.prepare("UPDATE sales SET paid_total = ?, payment_status = ?, paid_date = ? WHERE id = ? AND user_id = ?")
        .run(paid_total, payment_status, paid_date, req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar pagamento" });
    }
  });

  app.patch("/api/sales/:id/due-date", authenticateToken, (req, res) => {
    const { due_date } = req.body;
    try {
      db.prepare("UPDATE sales SET due_date = ? WHERE id = ? AND user_id = ?")
        .run(due_date, req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar vencimento" });
    }
  });

  // Quotes
  app.get("/api/quotes", authenticateToken, (req, res) => {
    const quotes = db.prepare("SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").all(req.user!.id) as any[];
    res.json(quotes.map(q => ({ ...q, items: JSON.parse(q.items || '[]') })));
  });
  app.post("/api/quotes", authenticateToken, (req, res) => {
    const { customer_id, motorcycle_details, total_value, observations, warranty_terms, validity_days, status, items } = req.body;
    const info = db.prepare("INSERT INTO quotes (user_id, customer_id, motorcycle_details, total_value, observations, warranty_terms, validity_days, status, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(req.user!.id, customer_id, motorcycle_details, total_value, observations, warranty_terms, validity_days, status, JSON.stringify(items));
    res.json({ id: parseInt(info.lastInsertRowid.toString()) });
  });

  // Credit / Fiado
  app.get("/api/credit", authenticateToken, (req, res) => {
    const creditItems = db.prepare("SELECT cr.*, c.name as customer_name, c.whatsapp, c.neighborhood FROM credit cr JOIN customers c ON cr.customer_id = c.id WHERE cr.user_id = ?").all(req.user!.id);
    res.json(creditItems.map(calculateCreditUpdate));
  });
  app.patch("/api/credit/:id/pay", authenticateToken, (req, res) => {
    db.prepare("UPDATE credit SET status = 'Pago' WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Leads
  app.get("/api/leads", authenticateToken, (req, res) => {
    const data = db.prepare(`SELECT * FROM leads WHERE user_id = ?`).all(req.user!.id);
    res.json(data);
  });
  app.post("/api/leads", authenticateToken, (req, res) => {
    const { name, company, value, priority, phone, status } = req.body;
    const info = db.prepare("INSERT INTO leads (user_id, name, customer_name, company, value, priority, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(req.user!.id, name, name, company, value || 0, priority || 'Média', phone, status || 'Prospecção');
    res.json({ id: parseInt(info.lastInsertRowid.toString()) });
  });
  app.put("/api/leads/:id", authenticateToken, (req, res) => {
    const { name, company, value, priority, phone, status } = req.body;
    db.prepare("UPDATE leads SET name = ?, customer_name = ?, company = ?, value = ?, priority = ?, phone = ?, status = ? WHERE id = ? AND user_id = ?")
      .run(name, name, company, value || 0, priority || 'Média', phone, status || 'Prospecção', req.params.id, req.user!.id);
    res.json({ success: true });
  });
  app.delete("/api/leads/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM leads WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Distributors
  app.get("/api/distributors", authenticateToken, (req, res) => {
    const data = db.prepare(`SELECT id, name, whatsapp as phone, contact as contact_person, created_at FROM distributors WHERE user_id = ?`).all(req.user!.id);
    res.json(data);
  });
  app.post("/api/distributors", authenticateToken, (req, res) => {
    const { name, phone, contact_person } = req.body;
    const info = db.prepare("INSERT INTO distributors (user_id, name, whatsapp, contact) VALUES (?, ?, ?, ?)").run(req.user!.id, name, phone, contact_person);
    res.json({ id: parseInt(info.lastInsertRowid.toString()), name, phone, contact_person });
  });
  app.put("/api/distributors/:id", authenticateToken, (req, res) => {
    const { name, phone, contact_person } = req.body;
    db.prepare("UPDATE distributors SET name = ?, whatsapp = ?, contact = ? WHERE id = ? AND user_id = ?").run(name, phone, contact_person, req.params.id, req.user!.id);
    res.json({ success: true });
  });
  app.delete("/api/distributors/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM distributors WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Fixed Services
  app.get("/api/fixed_services", authenticateToken, (req, res) => {
    const data = db.prepare(`SELECT * FROM fixed_services WHERE user_id = ?`).all(req.user!.id);
    res.json(data);
  });
  app.post("/api/fixed_services", authenticateToken, (req, res) => {
    const { name, price, payout } = req.body;
    const info = db.prepare("INSERT INTO fixed_services (user_id, name, price, payout) VALUES (?, ?, ?, ?)").run(req.user!.id, name, price || 0, payout || 0);
    res.json({ id: parseInt(info.lastInsertRowid.toString()) });
  });
  app.put("/api/fixed_services/:id", authenticateToken, (req, res) => {
    const { name, price, payout } = req.body;
    db.prepare("UPDATE fixed_services SET name = ?, price = ?, payout = ? WHERE id = ? AND user_id = ?").run(name, price || 0, payout || 0, req.params.id, req.user!.id);
    res.json({ success: true });
  });
  app.delete("/api/fixed_services/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM fixed_services WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  app.get("/api/registered_services", authenticateToken, (req, res) => {
    const services = db.prepare("SELECT * FROM registered_services WHERE user_id = ?").all(req.user!.id);
    res.json(services);
  });
  app.post("/api/registered_services", authenticateToken, (req, res) => {
    try {
      const { description, price, category } = req.body;
      const info = db.prepare("INSERT INTO registered_services (user_id, name, description, base_price, category) VALUES (?, ?, ?, ?, ?)")
        .run(req.user!.id, description, description, price, category || '');
      res.json({ id: parseInt(info.lastInsertRowid.toString()) });
    } catch (err: any) {
      console.error('ERRO AO SALVAR SERVIÇO:', err);
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/registered_services/:id", authenticateToken, (req, res) => {
    try {
      const { description, price, category } = req.body;
      db.prepare("UPDATE registered_services SET name = ?, description = ?, base_price = ?, category = ? WHERE id = ? AND user_id = ?")
        .run(description, description, price, category || '', req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      console.error('ERRO AO EDITAR SERVIÇO:', err);
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/registered_services/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM registered_services WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Purchase Orders
  app.get("/api/purchase_orders", authenticateToken, (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, d.name as distributor_name, o.created_at as date 
      FROM purchase_orders o 
      LEFT JOIN distributors d ON o.distributor_id = d.id 
      WHERE o.user_id = ? 
      ORDER BY o.created_at DESC
    `).all(req.user!.id) as any[];
    res.json(orders.map(o => ({ 
      ...o, 
      items: db.prepare("SELECT * FROM purchase_order_items WHERE purchase_order_id = ?").all(o.id) 
    })));
  });
  app.post("/api/purchase_orders", authenticateToken, (req, res) => {
    const { distributor_id, items } = req.body;
    const insertOrder = db.transaction((distId, orderItems) => {
      const info = db.prepare("INSERT INTO purchase_orders (user_id, distributor_id, status) VALUES (?, ?, ?)").run(req.user!.id, distId, 'Pendente');
      const orderId = info.lastInsertRowid;
      const insertItem = db.prepare("INSERT INTO purchase_order_items (purchase_order_id, description, quantity, price) VALUES (?, ?, ?, ?)");
      for (const item of orderItems) insertItem.run(orderId, item.description, item.quantity, item.price || 0);
      return orderId;
    });
    res.json({ id: parseInt(insertOrder(distributor_id, items).toString()) });
  });

  app.put("/api/purchase_orders/:id", authenticateToken, (req, res) => {
    const { distributor_id, items, status } = req.body;
    const updateOrder = db.transaction((orderId, distId, orderStatus, orderItems) => {
      if (distId) db.prepare("UPDATE purchase_orders SET distributor_id = ? WHERE id = ? AND user_id = ?").run(distId, orderId, req.user!.id);
      if (orderStatus) db.prepare("UPDATE purchase_orders SET status = ? WHERE id = ? AND user_id = ?").run(orderStatus, orderId, req.user!.id);
      
      if (orderItems) {
        db.prepare("DELETE FROM purchase_order_items WHERE purchase_order_id = ?").run(orderId);
        const insertItem = db.prepare("INSERT INTO purchase_order_items (purchase_order_id, description, quantity, price) VALUES (?, ?, ?, ?)");
        for (const item of orderItems) insertItem.run(orderId, item.description, item.quantity, item.price || 0);
      }
    });

    try {
      updateOrder(req.params.id, distributor_id, status, items);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar pedido" });
    }
  });

  app.delete("/api/purchase_orders/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM purchase_orders WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir pedido" });
    }
  });

  // Cash Sessions & Transactions
  app.get("/api/cash_sessions", authenticateToken, (req, res) => {
    res.json(db.prepare("SELECT * FROM cash_sessions WHERE user_id = ? ORDER BY opened_at DESC").all(req.user!.id));
  });
  app.post("/api/cash_sessions", authenticateToken, (req, res) => {
    const { id, opened_at, opening_balance, status, notes } = req.body;
    db.prepare("INSERT INTO cash_sessions (id, user_id, opened_at, opening_balance, status, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, req.user!.id, opened_at, opening_balance, status, notes);
    res.json({ success: true });
  });
  app.put("/api/cash_sessions/:id", authenticateToken, (req, res) => {
    const { closed_at, closing_balance, expected_balance, status } = req.body;
    db.prepare("UPDATE cash_sessions SET closed_at = ?, closing_balance = ?, expected_balance = ?, status = ? WHERE id = ? AND user_id = ?")
      .run(closed_at, closing_balance, expected_balance, status, req.params.id, req.user!.id);
    res.json({ success: true });
  });

  app.get("/api/cash_transactions", authenticateToken, (req, res) => {
    res.json(db.prepare("SELECT * FROM cash_transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.user!.id));
  });
  app.post("/api/cash_transactions", authenticateToken, (req, res) => {
    const { id, session_id, type, amount, description, date } = req.body;
    db.prepare("INSERT INTO cash_transactions (id, user_id, session_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, req.user!.id, session_id, type, amount, description, date);
    res.json({ success: true });
  });

  // Short Links System
  app.get("/api/short_links/:code", (req, res) => {
    const data = db.prepare("SELECT url FROM short_links WHERE code = ?").get(req.params.code) as any;
    if (data) {
      // In standalone local mode, we return the JSON or can redirect
      if (req.headers.accept?.includes('application/json')) {
        res.json({ url: data.url });
      } else {
        res.redirect(data.url);
      }
    } else {
      res.status(404).send("Link não encontrado");
    }
  });

  app.post("/api/short_links", (req, res) => {
    const { code, url } = req.body;
    db.prepare("INSERT OR REPLACE INTO short_links (code, url) VALUES (?, ?)").run(code, url);
    res.json({ success: true });
  });
  app.get("/api/short_links", async (req, res) => {
    const { codes } = req.query as any;
    if (!codes) return res.json([]);
    const codesList = codes.split(',');
    const placeholders = codesList.map(() => '?').join(',');
    const data = db.prepare(`SELECT * FROM short_links WHERE code IN (${placeholders})`).all(...codesList);
    res.json(data);
  });

  // Image Upload
  app.post("/api/upload", authenticateToken, (req, res) => {
    const { fileName, fileContent } = req.body;
    const buffer = Buffer.from(fileContent, 'base64');
    const filename = `${Date.now()}_${fileName}`;
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    res.json({ url: `/uploads/${filename}` });
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
    const productsCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE user_id = ?").get(req.user!.id) as any;
    const customersCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE user_id = ?").get(req.user!.id) as any;
    const salesTotal = db.prepare("SELECT SUM(total) as total FROM sales WHERE user_id = ?").get(req.user!.id) as any;
    res.json({ 
      products: productsCount.count, 
      customers: customersCount.count, 
      revenue: salesTotal.total || 0,
      openServiceOrders: 0
    });
  });

  // Seed data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const adminId = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword).lastInsertRowid;
    console.log("Admin user created: admin / admin123");
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        hmr: { port: 24678 }
      },
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
    console.log(`\n=================================================`);
    console.log(`🚀 ERP Kombat Moto Pecas - Sistema Pronto!`);
    console.log(`📞 Local: http://localhost:${PORT}`);
    console.log(`🌐 Rede: Disponivel em qualquer computador da oficina`);
    console.log(`   Use o seu IP seguido de :${PORT}`);
    console.log(`=================================================\n`);
  });
}

startServer();
