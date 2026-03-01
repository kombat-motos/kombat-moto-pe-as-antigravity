import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "kombat-moto-secret-key-2024";

const db = new Database("./kombat_moto_backup.db");

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
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS motorcycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    plate TEXT NOT NULL,
    model TEXT NOT NULL,
    current_km INTEGER DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
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

  // Authentication Middleware
  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Acesso negado. Faça login para continuar." });
    }

    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified as { id: number; username: string };
      next();
    } catch (err) {
      res.status(401).json({ error: "Sessão inválida" });
    }
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

  // API Routes (Protected with RLS logic)

  // Customers
  app.get("/api/customers", authenticateToken, (req, res) => {
    const customers = db.prepare("SELECT * FROM customers WHERE user_id = ?").all(req.user!.id);
    res.json(customers);
  });

  app.post("/api/customers", authenticateToken, (req, res) => {
    const { name, cpf, whatsapp, address, neighborhood, zip_code } = req.body;
    const info = db.prepare("INSERT INTO customers (user_id, name, cpf, whatsapp, address, neighborhood, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?)").run(req.user!.id, name, cpf, whatsapp, address, neighborhood, zip_code);
    res.json({ id: info.lastInsertRowid });
  });

  // Motorcycles
  app.get("/api/motorcycles", authenticateToken, (req, res) => {
    const motorcycles = db.prepare(`
      SELECT m.*, c.name as customer_name 
      FROM motorcycles m 
      JOIN customers c ON m.customer_id = c.id
      WHERE m.user_id = ?
    `).all(req.user!.id);
    res.json(motorcycles);
  });

  app.post("/api/motorcycles", authenticateToken, (req, res) => {
    const { customer_id, plate, model, current_km } = req.body;
    const info = db.prepare("INSERT INTO motorcycles (user_id, customer_id, plate, model, current_km) VALUES (?, ?, ?, ?, ?)").run(req.user!.id, customer_id, plate, model, current_km);
    res.json({ id: info.lastInsertRowid });
  });

  // Products
  app.get("/api/products", authenticateToken, (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE user_id = ?").all(req.user!.id);
    res.json(products);
  });

  app.post("/api/products", authenticateToken, (req, res) => {
    const { description, sku, barcode, purchase_price, sale_price, stock, unit, image_url } = req.body;
    const info = db.prepare("INSERT INTO products (user_id, description, sku, barcode, purchase_price, sale_price, stock, unit, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(req.user!.id, description, sku, barcode, purchase_price, sale_price, stock, unit, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/products/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  app.put("/api/products/:id", authenticateToken, (req, res) => {
    const { description, sku, barcode, purchase_price, sale_price, stock, unit, image_url } = req.body;
    db.prepare("UPDATE products SET description = ?, sku = ?, barcode = ?, purchase_price = ?, sale_price = ?, stock = ?, unit = ?, image_url = ? WHERE id = ? AND user_id = ?")
      .run(description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Catalog by Category
  app.get("/api/vendas/catalogo/:categoria", (req, res) => {
    const { categoria } = req.params;
    // Public route, but we could restrict it or use a specific user_id if needed
    const products = db.prepare("SELECT description, sale_price FROM products WHERE category = ? AND stock > 0").all(categoria);

    if (products.length === 0) {
      return res.status(404).send("Nenhum produto encontrado para esta categoria.");
    }

    let catalogMessage = `*Kombat Moto Peças - Catálogo de ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}*\n\n`;
    products.forEach((product: any) => {
      catalogMessage += `✅ ${product.description}: R$ ${product.sale_price.toFixed(2)}\n`;
    });
    catalogMessage += `\n_Valores sujeitos a alteração e disponibilidade de estoque._\n_Entre em contato para mais informações!_`;

    res.send(catalogMessage);
  });

  // Credit
  app.get("/api/credit", authenticateToken, (req, res) => {
    const creditItems = db.prepare(`
      SELECT cr.*, c.name as customer_name, c.whatsapp, c.neighborhood
      FROM credit cr
      JOIN customers c ON cr.customer_id = c.id
      WHERE cr.user_id = ?
    `).all(req.user!.id);

    const updatedItems = creditItems.map(calculateCreditUpdate);
    res.json(updatedItems);
  });

  app.post("/api/credit", authenticateToken, (req, res) => {
    const { customer_id, original_value, due_date } = req.body;
    const info = db.prepare("INSERT INTO credit (user_id, customer_id, original_value, due_date) VALUES (?, ?, ?, ?)").run(req.user!.id, customer_id, original_value, due_date);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/credit/:id/pay", authenticateToken, (req, res) => {
    db.prepare("UPDATE credit SET status = 'Pago' WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
    try {
      const monthlyRevenue = db.prepare(`
        SELECT SUM(p.sale_price * s.quantity) as total 
        FROM sales s 
        JOIN products p ON s.product_id = p.id 
        WHERE strftime('%m', s.sale_date) = strftime('%m', 'now') 
        AND s.user_id = ?
      `).get(req.user!.id) as any;

      const creditItems = db.prepare("SELECT * FROM credit WHERE status != 'Pago' AND user_id = ?").all(req.user!.id);
      const updatedCredit = creditItems.map(calculateCreditUpdate);
      const delinquency = updatedCredit.filter(i => i.status === 'Atrasado').reduce((acc, curr) => acc + curr.original_value, 0);

      const openServiceOrders = db.prepare("SELECT COUNT(*) as count FROM motorcycles WHERE current_km % 3000 > 2500 AND user_id = ?").get(req.user!.id) as any;

      const topProducts = db.prepare(`
        SELECT p.description, SUM(s.quantity) as total_sold 
        FROM sales s 
        JOIN products p ON s.product_id = p.id 
        WHERE s.user_id = ?
        GROUP BY p.id 
        ORDER BY total_sold DESC 
        LIMIT 5
      `).all(req.user!.id);

      res.json({
        revenue: (monthlyRevenue && monthlyRevenue.total) ? monthlyRevenue.total : 0,
        delinquency: delinquency,
        openServiceOrders: (openServiceOrders && openServiceOrders.count) ? openServiceOrders.count : 0,
        topProducts: topProducts || []
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Erro ao carregar estatísticas" });
    }
  });

  // Sales
  app.get("/api/sales", authenticateToken, (req, res) => {
    const sales = db.prepare(`
      SELECT s.*, p.description as product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.user_id = ?
    `).all(req.user!.id);
    res.json(sales);
  });

  app.post("/api/sales", authenticateToken, (req, res) => {
    const { product_id, quantity } = req.body;
    const info = db.prepare("INSERT INTO sales (user_id, product_id, quantity) VALUES (?, ?, ?)").run(req.user!.id, product_id, quantity);
    res.json({ id: info.lastInsertRowid });
  });

  // Seed data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const adminId = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword).lastInsertRowid;

    const custId = db.prepare("INSERT INTO customers (user_id, name, cpf, whatsapp, address, neighborhood, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      adminId, "João Silva", "000.000.000-00", "5511999999999", "Rua das Flores, 123", "", "01001-000"
    ).lastInsertRowid;

    db.prepare("INSERT INTO motorcycles (user_id, customer_id, plate, model, current_km) VALUES (?, ?, ?, ?, ?)").run(
      adminId, custId, "ABC-1234", "Honda CB 500", 12500
    );

    db.prepare("INSERT INTO products (user_id, description, sku, barcode, purchase_price, sale_price, stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      adminId, "Óleo Motul 5100", "MOT-5100", "7891234567890", 45.00, 65.00, 20, "Unitário"
    );

    db.prepare("INSERT INTO credit (user_id, customer_id, original_value, due_date) VALUES (?, ?, ?, ?)").run(
      adminId, custId, 150.00, "2024-01-01" // Overdue
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
