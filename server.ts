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
import { GoogleGenAI } from "@google/genai";
import { createAIRouter } from "./server/modules/ai/ai.routes.js";
import { createAIInstructionsRouter } from "./server/modules/ai-instructions/ai-instructions.routes.js";
import { Jimp } from "jimp";
import jsQR from "jsqr";
import { readBarcodesFromImageFile } from "zxing-wasm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test if DB is writable
try {
  const dbPathTest = process.env.DB_PATH || "./kombat_moto_backup.db";
  fs.accessSync(path.dirname(path.resolve(dbPathTest)), fs.constants.W_OK);
  console.log(`[DB] Database directory is writable: ${path.dirname(path.resolve(dbPathTest))}`);
} catch (e) {
  console.error(`[DB] CRITICAL: Database directory is NOT writable!`, e);
}

const JWT_SECRET = process.env.JWT_SECRET || "kombat-moto-secret-key-2024";

const dbPath = process.env.DB_PATH || "./kombat_moto_backup.db";
const db = new Database(dbPath);

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string; role?: string };
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
    image_url TEXT,
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
    distributor TEXT,
    alt_code TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS mechanics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    commission_rate REAL DEFAULT 50,
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
    mechanic_name TEXT,
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

  CREATE TABLE IF NOT EXISTS accounts_payable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fornecedor TEXT NOT NULL,
    valor REAL NOT NULL,
    due_date TEXT NOT NULL,
    linha_digitavel TEXT,
    codigo_pix TEXT,
    status TEXT DEFAULT 'Pendente',
    paid_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS short_links (
    code TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT,
    module TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    tool_name TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module TEXT,
    action TEXT,
    tool_name TEXT,
    query_summary TEXT,
    result_count INTEGER,
    model TEXT,
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS ai_instructions (
    id TEXT PRIMARY KEY,
    tenant_id INTEGER,
    company_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category TEXT,
    instruction_type TEXT,
    priority TEXT,
    status TEXT DEFAULT 'rascunho',
    is_global BOOLEAN DEFAULT 0,
    valid_from TEXT,
    valid_until TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_instruction_modules (
    id TEXT PRIMARY KEY,
    instruction_id TEXT NOT NULL,
    module TEXT,
    route TEXT,
    FOREIGN KEY (instruction_id) REFERENCES ai_instructions (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_instruction_keywords (
    id TEXT PRIMARY KEY,
    instruction_id TEXT NOT NULL,
    keyword TEXT NOT NULL,
    FOREIGN KEY (instruction_id) REFERENCES ai_instructions (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_instruction_versions (
    id TEXT PRIMARY KEY,
    instruction_id TEXT NOT NULL,
    version_number INTEGER,
    content TEXT NOT NULL,
    changed_by INTEGER,
    change_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instruction_id) REFERENCES ai_instructions (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_instruction_usage_logs (
    id TEXT PRIMARY KEY,
    instruction_id TEXT NOT NULL,
    tenant_id INTEGER,
    user_id INTEGER,
    module TEXT,
    route TEXT,
    question TEXT,
    relevance_score REAL,
    used_at TEXT DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN,
    FOREIGN KEY (instruction_id) REFERENCES ai_instructions (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_instruction_feedback (
    id TEXT PRIMARY KEY,
    tenant_id INTEGER,
    user_id INTEGER,
    conversation_id TEXT,
    message_id TEXT,
    feedback_type TEXT,
    comment TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_dictionary (
    id TEXT PRIMARY KEY,
    tenant_id INTEGER,
    term TEXT NOT NULL,
    meaning TEXT NOT NULL,
    synonyms TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
  "ALTER TABLE sales ADD COLUMN mechanic_name TEXT",
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
  "ALTER TABLE customers ADD COLUMN image_url TEXT",
  "ALTER TABLE registered_services ADD COLUMN category TEXT",
  "ALTER TABLE quotes ADD COLUMN motorcycle_details TEXT",
  "ALTER TABLE quotes ADD COLUMN customer_id INTEGER",
  "ALTER TABLE quotes ADD COLUMN customer_name TEXT",
  "ALTER TABLE quotes ADD COLUMN items TEXT",
  "ALTER TABLE leads ADD COLUMN company TEXT",
  "ALTER TABLE leads ADD COLUMN value REAL DEFAULT 0",
  "ALTER TABLE leads ADD COLUMN priority TEXT DEFAULT 'Média'",
  "ALTER TABLE leads ADD COLUMN phone TEXT",
  "ALTER TABLE leads ADD COLUMN name TEXT",
  "ALTER TABLE products ADD COLUMN distributor TEXT",
  "ALTER TABLE products ADD COLUMN alt_code TEXT"
];

migrations.forEach(m => {
  try { db.exec(m); } catch (e) {}
});
try { db.exec("UPDATE leads SET name = customer_name WHERE name IS NULL"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN city TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN fine_rate REAL DEFAULT 2"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN interest_rate REAL DEFAULT 1"); } catch (e) {}
try { db.exec("ALTER TABLE mechanics ADD COLUMN commission_rate REAL DEFAULT 50"); } catch (e) {}

  // --- CRM Table Initializations ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      cpf_cnpj TEXT,
      cidade TEXT,
      endereco TEXT,
      modelo_moto TEXT,
      ano_moto TEXT,
      placa_moto TEXT,
      observacoes TEXT,
      status TEXT DEFAULT 'Novo',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS atendimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      status TEXT DEFAULT 'Novo',
      atendente_name TEXT,
      observacoes TEXT,
      last_contact TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      atendimento_id INTEGER NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      observacoes TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (atendimento_id) REFERENCES atendimentos (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orcamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cliente_id INTEGER,
      customer_name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      motorcycle_details TEXT,
      motorcycle_year TEXT,
      service_description TEXT,
      labor_value REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_value REAL NOT NULL,
      payment_method TEXT,
      observacoes TEXT,
      status TEXT DEFAULT 'Pendente',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS orcamento_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orcamento_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_value REAL NOT NULL,
      total_value REAL NOT NULL,
      observacoes TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS servicos_oficina (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cliente_id INTEGER,
      customer_name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      motorcycle_details TEXT,
      motorcycle_year TEXT,
      motorcycle_plate TEXT,
      service_requested TEXT NOT NULL,
      mechanic_id INTEGER,
      mechanic_name TEXT,
      status TEXT DEFAULT 'Aguardando avaliação',
      entry_date TEXT DEFAULT CURRENT_TIMESTAMP,
      delivery_forecast TEXT,
      labor_value REAL DEFAULT 0,
      parts_value REAL DEFAULT 0,
      total_value REAL DEFAULT 0,
      observacoes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL,
      FOREIGN KEY (mechanic_id) REFERENCES mechanics (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS servico_pecas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      servico_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      observacoes TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (servico_id) REFERENCES servicos_oficina (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS mensagens_prontas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      observacoes TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      observacoes TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS cliente_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      observacoes TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS relatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT,
      content TEXT,
      observacoes TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      observacoes TEXT,
      status TEXT DEFAULT 'Pendente',
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER NOT NULL,
      cliente_id INTEGER,
      acao TEXT NOT NULL,
      origem TEXT NOT NULL,
      resumo TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // CRM Migrations
  try { db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Administrador'"); } catch (e) {}

  // Seed default tags
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM tags").get() as any;
    if (count.cnt === 0) {
      const insertTag = db.prepare("INSERT INTO tags (user_id, name, color) VALUES (1, ?, ?)");
      const defaultTags = [
        ['Cliente novo', 'bg-blue-100 text-blue-800 border-blue-200'],
        ['Cliente fiel', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
        ['Procura peça', 'bg-purple-100 text-purple-800 border-purple-200'],
        ['Procura serviço', 'bg-indigo-100 text-indigo-800 border-indigo-200'],
        ['Orçamento quente', 'bg-rose-100 text-rose-800 border-rose-200'],
        ['Orçamento frio', 'bg-slate-100 text-slate-800 border-slate-200'],
        ['Aguardando pagamento', 'bg-amber-100 text-amber-800 border-amber-200'],
        ['Moto na oficina', 'bg-cyan-100 text-cyan-800 border-cyan-200'],
        ['Comprar depois', 'bg-teal-100 text-teal-800 border-teal-200'],
        ['Cliente de pneus', 'bg-orange-100 text-orange-800 border-orange-200'],
        ['Cliente de óleo', 'bg-lime-100 text-lime-800 border-lime-200'],
        ['Cliente de bateria', 'bg-yellow-100 text-yellow-800 border-yellow-200'],
        ['Cliente de motor', 'bg-violet-100 text-violet-800 border-violet-200'],
        ['Cliente inadimplente', 'bg-red-100 text-red-800 border-red-200']
      ];
      defaultTags.forEach(([name, color]) => {
        try { insertTag.run(name, color); } catch (e) {}
      });
      console.log("[DB] Default tags seeded successfully");
    }
  } catch (e) {
    console.error("Error seeding default tags:", e);
  }

  // Seed default quick messages
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM mensagens_prontas").get() as any;
    if (count.cnt === 0) {
      const insertMsg = db.prepare("INSERT INTO mensagens_prontas (user_id, category, title, content) VALUES (1, ?, ?, ?)");
      const defaultMsgs = [
        ['Saudação inicial', 'Saudação Geral', 'Olá! Seja bem-vindo à Kombat Moto Peças 🏍️\nMe diga o modelo e ano da sua moto e qual peça ou serviço você precisa.'],
        ['Pedido de dados', 'Solicitação de Cadastro', 'Para agilizar seu atendimento, me envie por favor:\nNome:\nModelo da moto:\nAno:\nPeça ou serviço que precisa:'],
        ['Orçamento enviado', 'Orçamentos', 'Olá, [NOME]! Tudo certo?\nSegue seu orçamento da Kombat Moto Peças:\n\nMoto: [MOTO]\nPeça/Serviço: [DESCRIÇÃO]\nValor das peças: R$ [VALOR]\nMão de obra: R$ [VALOR]\nTotal: R$ [TOTAL]\n\nForma de pagamento: Pix, dinheiro ou cartão.\nCartão em até 3x sem juros. Até 12x com acréscimo.\n\nKombat Moto Peças\nRua Paraná, 342, Centro, Andirá – PR\nWhatsApp: 43 3538-4537'],
        ['Cobrança de retorno', 'Acompanhamento', 'Olá! Passando para saber se conseguiu analisar o orçamento que te enviei. Ficamos no aguardo!'],
        ['Serviço aprovado', 'Serviço Oficina', 'Olá, [NOME]! Seu serviço foi aprovado e já iniciamos a manutenção da sua moto. Te avisamos assim que estiver pronta!'],
        ['Moto pronta', 'Serviço Oficina', 'Olá, [NOME]! Sua moto já está pronta para retirada. 🏍️\n\nKombat Moto Peças\nRua Paraná, 342, Centro, Andirá – PR\nWhatsApp: 43 3538-4537'],
        ['Pós-venda', 'Acompanhamento', 'Olá, [NOME]! Passando para saber se ficou tudo certo com sua moto. Qualquer coisa, estamos à disposição. 🏍️'],
        ['Promoções', 'Marketing', 'Olá! Temos promoções especiais de peças e serviços esta semana na Kombat Moto Peças! Venha conferir!'],
        ['Cliente fiel', 'Marketing', 'Olá, [NOME]! Como você é um cliente especial, preparamos um desconto exclusivo para sua próxima revisão!'],
        ['Aviso de pagamento', 'Financeiro', 'Olá! Passando para lembrar sobre o pagamento pendente. Qualquer dúvida sobre a forma de pagamento, estamos à disposição.'],
        ['Aviso de não vendemos fiado', 'Financeiro', 'Prezado cliente, informamos que para manter nossos preços baixos e a qualidade no atendimento, não realizamos vendas no fiado. Agradecemos a compreensão!']
      ];
      defaultMsgs.forEach(([title, category, content]) => {
        insertMsg.run(category, title, content);
      });
      console.log("[DB] Default quick messages seeded successfully");
    }
  } catch (e) {
    console.error("Error seeding quick messages:", e);
  }

  // Migrate legacy customers and motorcycles to flat 'clientes' table
  try {
    const countClientes = db.prepare("SELECT COUNT(*) as cnt FROM clientes").get() as any;
    if (countClientes.cnt === 0) {
      db.exec(`
        INSERT INTO clientes (id, user_id, nome, telefone, cpf_cnpj, cidade, endereco, modelo_moto, placa_moto, status, created_at)
        SELECT 
          c.id, 
          c.user_id, 
          c.name, 
          c.whatsapp, 
          COALESCE(c.cpf, c.cnpj) as cpf_cnpj, 
          c.city, 
          c.address, 
          m.model as modelo_moto, 
          m.plate as placa_moto, 
          'Cliente ativo' as status,
          c.created_at
        FROM customers c
        LEFT JOIN (
          SELECT customer_id, model, plate, MIN(id) 
          FROM motorcycles 
          GROUP BY customer_id
        ) m ON c.id = m.customer_id;
      `);
      console.log("[DB] Legacy customers migrated to 'clientes' successfully");
    }
  } catch (e) {
    console.error("Error migrating legacy customers to clientes:", e);
  }

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  app.use(cookieParser());

  // Logging Middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

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

  // Authentication Middleware - Bypass for local standalone mode, but supports JWT decoding
  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // For local standalone mode, we automatically ensure a default user
    try {
      const defaultAdmin = db.prepare("SELECT id FROM users WHERE id = 1").get() as any;
      if (!defaultAdmin) {
        const hashedPassword = bcrypt.hashSync("admin123", 10);
        db.prepare("INSERT INTO users (id, username, password, role) VALUES (1, 'admin', ?, 'Administrador')").run(hashedPassword);
        console.log("[AUTH] Default admin user created (ID 1)");
      }
    } catch (e) {
      console.error("[AUTH] Error ensuring default user:", e);
    }
    
    // Try to get token from header or cookie
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.auth_token;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = db.prepare("SELECT id, username, role FROM users WHERE id = ?").get(decoded.id) as any;
        if (user) {
          req.user = { id: user.id, username: user.username, role: user.role || 'Administrador' };
          return next();
        }
      } catch (err) {
        console.warn("[AUTH] Invalid token, falling back to default admin:", err);
      }
    }

    try {
      const defaultUser = db.prepare("SELECT id, username, role FROM users WHERE id = 1").get() as any;
      req.user = { id: 1, username: 'admin', role: (defaultUser && defaultUser.role) || 'Administrador' };
    } catch (e) {
      req.user = { id: 1, username: 'admin', role: 'Administrador' };
    }
    next();
  };

  // AI Router
  app.use("/api/ai_assistant", authenticateToken, createAIRouter(db));
  app.use("/api/ai_instructions", authenticateToken, createAIInstructionsRouter(db));

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Usuário e senha obrigatórios" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'Administrador')").run(username, hashedPassword);
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
    res.json({ id: user.id, username: user.username, role: user.role || 'Administrador', token });
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

  // Health check
  app.get("/api/health-check", (req, res) => res.json({ status: "ok", version: "1.0.3", timestamp: new Date().toISOString() }));

  // Internal Image Shortener/Redirector
  app.get("/api/public/img/:id/:index", (req, res) => {
    try {
      const { id, index } = req.params;
      const product = db.prepare("SELECT image_url, image_url2, image_url3, image_url4 FROM products WHERE id = ?").get(id) as any;
      
      if (!product) return res.status(404).send("Produto não encontrado");
      
      const fields = ['image_url', 'image_url2', 'image_url3', 'image_url4'];
      const field = fields[parseInt(index) - 1] || 'image_url';
      const url = product[field];
      
      if (!url) return res.status(404).send("Foto não disponível");
      
      res.redirect(url);
    } catch (err: any) {
      res.status(500).send("Erro ao redirecionar: " + err.message);
    }
  });

  // Public Catalog for AI
  app.get("/api/public/catalog-ai", (req, res) => {
    try {
      const products = db.prepare("SELECT * FROM products WHERE user_id = 1 ORDER BY description ASC").all() as any[];
      let content = "# CATÁLOGO DE ESTOQUE - KOMBAT MOTO\n";
      content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      products.forEach(p => {
        content += `PRODUTO: ${p.description}\n`;
        if (p.sku) content += `SKU: ${p.sku}\n`;
        if (p.brand) content += `MARCA: ${p.brand}\n`;
        content += `PREÇO: R$ ${p.sale_price.toFixed(2)}\n`;
        content += `ESTOQUE: ${p.stock} ${p.unit || 'un'}\n`;
        if (p.category) content += `CATEGORIA: ${p.category}\n`;
        if (p.application) content += `APLICAÇÃO: ${p.application}\n`;
        
        // Use shortened internal URL for photos
        if (p.image_url) content += `FOTO 1: ${baseUrl}/api/public/img/${p.id}/1\n`;
        if (p.image_url2) content += `FOTO 2: ${baseUrl}/api/public/img/${p.id}/2\n`;
        if (p.image_url3) content += `FOTO 3: ${baseUrl}/api/public/img/${p.id}/3\n`;
        if (p.image_url4) content += `FOTO 4: ${baseUrl}/api/public/img/${p.id}/4\n`;
        
        content += `------------------------------------------\n\n`;
      });
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch (err: any) {
      res.status(500).send("Erro ao gerar catálogo: " + err.message);
    }
  });

  app.get("/api/public/inventory.json", (req, res) => {
    try {
      const products = db.prepare("SELECT description, sku, brand, sale_price, stock, category, application, image_url FROM products WHERE user_id = 1 ORDER BY description ASC").all();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rota leve de produtos para o catálogo interno (sem base64, apenas URLs externas)
  // Reduz drasticamente o payload quando as imagens são base64 embutidas
  app.get("/api/public/products-light", authenticateToken, (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = (req.query.q as string || '').trim();

      let query = "SELECT id, description, sku, barcode, sale_price, stock, unit, category, brand, application FROM products WHERE user_id = ?";
      const params: any[] = [1]; // catálogo público sempre user_id 1

      if (search) {
        query += " AND (description LIKE ? OR sku LIKE ? OR brand LIKE ?)";
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      query += " ORDER BY description ASC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const countQuery = search
        ? "SELECT COUNT(*) as total FROM products WHERE user_id = ? AND (description LIKE ? OR sku LIKE ? OR brand LIKE ?)"
        : "SELECT COUNT(*) as total FROM products WHERE user_id = ?";
      const countParams = search
        ? [1, `%${search}%`, `%${search}%`, `%${search}%`]
        : [1];

      const products = db.prepare(query).all(...params);
      const { total } = db.prepare(countQuery).get(...countParams) as any;

      // Adiciona a URL da imagem apenas se não for base64 (muito grande para mobile)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const productsWithImages = (products as any[]).map(p => ({
        ...p,
        image_url: `${baseUrl}/api/public/img/${p.id}/1`
      }));

      res.setHeader('Cache-Control', 'private, max-age=60');
      res.json({
        products: productsWithImages,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Catálogo público HTML — otimizado para mobile com paginação JS nativa e lazy loading
  app.get("/api/public/catalog-page", (req, res) => {
    try {
      // Seleciona apenas campos necessários para o catálogo (sem base64 pesado no HTML)
      const products = db.prepare(
        "SELECT id, description, sku, brand, sale_price, stock, unit, category FROM products WHERE user_id = 1 ORDER BY description ASC"
      ).all() as any[];

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Serializa os dados como JSON compacto para o script de paginação
      const productsJson = JSON.stringify(products.map(p => ({
        id: p.id,
        d: p.description,
        s: p.sku || '',
        b: p.brand || '',
        p: p.sale_price,
        q: p.stock,
        u: p.unit || 'un',
        c: p.category || 'Peças',
        img: `${baseUrl}/api/public/img/${p.id}/1`
      })));

      // Cache de 5 minutos no CDN/proxy — evita rebuscar o catálogo inteiro a cada acesso
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catálogo Kombat Moto Peças</title>
  <meta name="description" content="Catálogo completo de peças para motos - Kombat Moto Peças, Andirá-PR">
  <!-- Google Fonts via link (não bloqueia render, ao contrário do @import) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap"></noscript>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:20px}
    .container{max-width:1200px;margin:0 auto}
    .header{text-align:center;margin-bottom:40px;padding-top:20px}
    .header h1{font-weight:900;text-transform:uppercase;letter-spacing:-2px;font-size:clamp(28px,6vw,42px);color:#b91c1c}
    .header p{color:#64748b;font-weight:500;margin-top:8px}
    /* Barra de busca */
    .search-bar{max-width:500px;margin:20px auto;position:relative}
    .search-bar input{width:100%;padding:14px 20px;border:1px solid #e2e8f0;border-radius:50px;font-size:16px;outline:none;font-family:inherit}
    .search-bar input:focus{border-color:#b91c1c;box-shadow:0 0 0 3px rgba(185,28,28,.1)}
    /* Grid responsivo */
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
    @media(max-width:480px){.grid{grid-template-columns:repeat(2,1fr);gap:12px}}
    .card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e2e8f0;display:flex;flex-direction:column}
    .card:hover{box-shadow:0 8px 24px rgba(0,0,0,.12);transform:translateY(-3px);transition:all .25s ease}
    .img-wrap{position:relative;width:100%;padding-bottom:100%;background:#fff;overflow:hidden}
    .img-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:8px;transition:transform .3s ease}
    .img-wrap img:hover{transform:scale(1.05)}
    .img-wrap .placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:11px;font-weight:700;text-transform:uppercase;background:linear-gradient(135deg,#f8fafc,#f1f5f9)}
    .badge{position:absolute;top:10px;right:10px;padding:3px 8px;border-radius:8px;font-size:9px;font-weight:800;text-transform:uppercase}
    .in{background:#dcfce7;color:#166534}
    .out{background:#fee2e2;color:#991b1b}
    .info{padding:16px;flex:1;display:flex;flex-direction:column}
    .cat{font-size:9px;font-weight:900;text-transform:uppercase;color:#ef4444;background:#fef2f2;padding:3px 10px;border-radius:100px;display:inline-block;margin-bottom:8px;align-self:flex-start}
    .name{font-size:14px;font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1;margin-bottom:8px}
    .price{font-size:20px;font-weight:900;color:#0f172a;margin-bottom:4px}
    .meta{display:flex;flex-wrap:wrap;gap:6px;font-size:10px;font-weight:600;color:#64748b;margin-top:auto}
    .meta span{background:#f1f5f9;padding:3px 8px;border-radius:6px}
    /* Paginação */
    .pagination{display:flex;align-items:center;justify-content:center;gap:16px;padding:40px 0 80px}
    .load-more{padding:14px 40px;background:#0f172a;color:#fff;border:none;border-radius:50px;font-family:inherit;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;transition:all .2s}
    .load-more:hover{background:#b91c1c}
    .counter{font-size:12px;color:#94a3b8;font-weight:600}
    /* Botão de impressão */
    .print-btn{position:fixed;bottom:24px;right:24px;background:#b91c1c;color:#fff;border:none;padding:14px 24px;border-radius:50px;font-family:inherit;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(185,28,28,.35);font-size:12px;text-transform:uppercase;letter-spacing:1px;z-index:100}
    @media print{.print-btn,.pagination,.search-bar{display:none}body{padding:0;background:#fff}.card{box-shadow:none;border:1px solid #eee;break-inside:avoid}}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Salvar PDF</button>
  <div class="container">
    <div class="header">
      <h1>Kombat Moto Peças</h1>
      <p id="subtitle">Carregando catálogo...</p>
    </div>
    <div class="search-bar">
      <input type="search" id="q" placeholder="Buscar por nome, SKU ou marca..." autocomplete="off">
    </div>
    <div class="grid" id="grid"></div>
    <div class="pagination" id="paginacao" style="display:none">
      <button class="load-more" id="load-more-btn" onclick="loadMore()">Carregar Mais</button>
      <span class="counter" id="counter"></span>
    </div>
  </div>

  <script>
    const ALL = ${productsJson};
    const PAGE = 20;
    let filtered = ALL;
    let shown = 0;

    function fmt(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);}

    function renderCard(p){
      return '<div class="card">'+
        '<div class="img-wrap">'+
          '<img src="'+p.img+'" alt="'+p.d.replace(/"/g,'&quot;')+'" loading="lazy" decoding="async" width="220" height="220" onerror="this.style.display=\'none\';">'+
          '<span class="badge '+(p.q>0?'in':'out')+'">'+(p.q>0?'Estoque':'Esgotado')+'</span>'+
        '</div>'+
        '<div class="info">'+
          '<span class="cat">'+p.c+'</span>'+
          '<p class="name">'+p.d+'</p>'+
          '<p class="price">'+fmt(p.p)+'</p>'+
          '<div class="meta">'+
            '<span>SKU: '+(p.s||'N/A')+'</span>'+
            (p.b?'<span>'+p.b+'</span>':'')+
            '<span>'+p.q+' '+p.u+'</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    }

    function renderPage(){
      const grid = document.getElementById('grid');
      const next = filtered.slice(shown, shown + PAGE);
      grid.insertAdjacentHTML('beforeend', next.map(renderCard).join(''));
      shown += next.length;
      const total = filtered.length;
      document.getElementById('subtitle').textContent = total + ' produtos no catálogo';
      document.getElementById('counter').textContent = 'Exibindo '+shown+' de '+total;
      const pag = document.getElementById('paginacao');
      pag.style.display = shown < total ? 'flex' : 'none';
      const btn = document.getElementById('load-more-btn');
      if(btn) btn.textContent = 'Carregar Mais ('+(total-shown)+' restantes)';
    }

    function loadMore(){ renderPage(); }

    function applyFilter(){
      const q = document.getElementById('q').value.toLowerCase().trim();
      filtered = q ? ALL.filter(p => p.d.toLowerCase().includes(q) || p.s.toLowerCase().includes(q) || p.b.toLowerCase().includes(q)) : ALL;
      shown = 0;
      document.getElementById('grid').innerHTML = '';
      renderPage();
    }

    let timer;
    document.getElementById('q').addEventListener('input', function(){
      clearTimeout(timer);
      timer = setTimeout(applyFilter, 250);
    });

    // Carga inicial
    renderPage();
  </script>
</body>
</html>`;

      res.send(html);
    } catch (err: any) {
      res.status(500).send("Erro ao gerar página: " + err.message);
    }
  });

  // Quotes
  app.get("/api/quotes", authenticateToken, (req, res) => {
    const quotes = db.prepare("SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").all(req.user!.id) as any[];
    res.json(quotes.map(q => ({ ...q, items: JSON.parse(q.items || '[]') })));
  });

  app.get("/api/quotes-update/:id", authenticateToken, (req, res) => {
    console.error(`[API] Teste GET para /api/quotes-update/${req.params.id}`);
    const quote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(req.params.id);
    res.json(quote || { error: "Não encontrado" });
  });

  app.put("/api/quotes-update/:id", authenticateToken, (req, res) => {
    console.error(`[API] Recebendo PUT /api/quotes-update/${req.params.id}`);
    const { customer_id, customer_name, motorcycle_details, total_value, observations, warranty_terms, validity_days, status, items } = req.body;
    const quoteId = Number(req.params.id);
    const userId = req.user!.id;
    
    try {
      const result = db.prepare(`
        UPDATE quotes 
        SET customer_id = ?, customer_name = ?, motorcycle_details = ?, total_value = ?, observations = ?, warranty_terms = ?, validity_days = ?, status = ?, items = ?
        WHERE id = ? AND user_id = ?
      `).run(
        customer_id, 
        customer_name, 
        motorcycle_details, 
        total_value, 
        observations, 
        warranty_terms, 
        validity_days, 
        status, 
        JSON.stringify(items), 
        quoteId,
        userId
      );

      console.error(`[API] Resultado do UPDATE quote ${quoteId}:`, result.changes);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Orçamento não encontrado ou sem permissão" });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('ERRO AO ATUALIZAR ORÇAMENTO:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/quotes", authenticateToken, (req, res) => {
    console.error(`[API] Recebendo POST /api/quotes`);
    const { customer_id, customer_name, motorcycle_details, total_value, observations, warranty_terms, validity_days, status, items } = req.body;
    const userId = req.user!.id;

    try {
      const info = db.prepare(`
        INSERT INTO quotes (user_id, customer_id, customer_name, motorcycle_details, total_value, observations, warranty_terms, validity_days, status, items) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, 
        customer_id, 
        customer_name, 
        motorcycle_details, 
        total_value, 
        observations, 
        warranty_terms, 
        validity_days, 
        status, 
        JSON.stringify(items)
      );
      
      const newQuote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(info.lastInsertRowid) as any;
      if (newQuote) {
        newQuote.items = JSON.parse(newQuote.items || '[]');
      }
      res.json(newQuote);
    } catch (err: any) {
      console.error('ERRO AO CRIAR ORÇAMENTO:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/quotes/:id", authenticateToken, (req, res) => {
    console.log(`[API] Recebendo PUT /api/quotes/${req.params.id}`);
    const { customer_id, customer_name, motorcycle_details, total_value, observations, warranty_terms, validity_days, status, items } = req.body;
    const quoteId = Number(req.params.id);
    const userId = req.user!.id;
    
    try {
      const result = db.prepare(`
        UPDATE quotes 
        SET customer_id = ?, customer_name = ?, motorcycle_details = ?, total_value = ?, observations = ?, warranty_terms = ?, validity_days = ?, status = ?, items = ?
        WHERE id = ? AND user_id = ?
      `).run(
        customer_id, 
        customer_name, 
        motorcycle_details, 
        total_value, 
        observations, 
        warranty_terms, 
        validity_days, 
        status, 
        JSON.stringify(items), 
        quoteId, 
        userId
      );
      
      if (result.changes === 0) {
        console.warn(`[API] Orçamento não encontrado ou sem permissão de edição. ID: ${quoteId}, Usuário: ${userId}`);
        return res.status(404).json({ error: "Orçamento não encontrado ou sem permissão de edição." });
      }
      
      const updatedQuote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(quoteId) as any;
      if (updatedQuote) {
        updatedQuote.items = JSON.parse(updatedQuote.items || '[]');
      }
      res.json(updatedQuote);
    } catch (err: any) {
      console.error('ERRO AO ATUALIZAR ORÇAMENTO:', err);
      res.status(500).json({ error: err.message || 'Erro interno no servidor sqlite' });
    }
  });

  app.delete("/api/quotes/:id", authenticateToken, (req, res) => {
    try {
      const result = db.prepare("DELETE FROM quotes WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Orçamento não encontrado" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('ERRO AO EXCLUIR ORÇAMENTO:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // Customers
  app.get("/api/customers", authenticateToken, (req, res) => {
    const customers = db.prepare("SELECT * FROM customers WHERE user_id = ? ORDER BY name ASC").all(req.user!.id);
    res.json(customers);
  });
  app.post("/api/customers", authenticateToken, (req, res) => {
    const { name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit, fine_rate, interest_rate, image_url } = req.body;
    const userId = req.user!.id;
    try {
      const run = db.transaction(() => {
        const info = db.prepare("INSERT INTO customers (user_id, name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit, fine_rate, interest_rate, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(userId, name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit || 0, fine_rate || 2, interest_rate || 1, image_url);
        const newId = info.lastInsertRowid;
        
        // Sync with CRM clientes table
        db.prepare(`
          INSERT INTO clientes (id, user_id, nome, telefone, cpf_cnpj, cidade, endereco, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Novo')
        `).run(newId, userId, name, whatsapp || '', cpf || cnpj || '', city || '', address || '');
        
        return newId;
      });
      const id = run();
      res.json({ id: parseInt(id.toString()) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/customers/:id", authenticateToken, (req, res) => {
    const { name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit, fine_rate, interest_rate, image_url } = req.body;
    const userId = req.user!.id;
    const customerId = req.params.id;
    try {
      db.transaction(() => {
        db.prepare(`
          UPDATE customers 
          SET name = ?, nickname = ?, cpf = ?, cnpj = ?, whatsapp = ?, address = ?, neighborhood = ?, city = ?, zip_code = ?, credit_limit = ?, fine_rate = ?, interest_rate = ?, image_url = ? 
          WHERE id = ? AND user_id = ?
        `).run(name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, credit_limit || 0, fine_rate || 2, interest_rate || 1, image_url, customerId, userId);
        
        // Sync CRM clientes
        const exists = db.prepare("SELECT id FROM clientes WHERE id = ? AND user_id = ?").get(customerId, userId);
        if (exists) {
          db.prepare(`
            UPDATE clientes
            SET nome = ?, telefone = ?, cpf_cnpj = ?, cidade = ?, endereco = ?
            WHERE id = ? AND user_id = ?
          `).run(name, whatsapp || '', cpf || cnpj || '', city || '', address || '', customerId, userId);
        } else {
          db.prepare(`
            INSERT INTO clientes (id, user_id, nome, telefone, cpf_cnpj, cidade, endereco, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Atualizado')
          `).run(customerId, userId, name, whatsapp || '', cpf || cnpj || '', city || '', address || '');
        }
      })();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

  app.get("/api/products", authenticateToken, (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE user_id = ? ORDER BY description ASC").all(req.user!.id);
    res.json(products);
  });

  app.get("/api/products/barcode/:barcode", authenticateToken, (req, res) => {
    try {
      const barcode = req.params.barcode.trim();
      const product = db.prepare("SELECT * FROM products WHERE user_id = ? AND (barcode = ? OR sku = ? OR alt_code = ?)").get(req.user!.id, barcode, barcode, barcode);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      res.json(product);
    } catch (err: any) {
      console.error('ERRO AO BUSCAR PRODUTO POR CÓDIGO:', err);
      res.status(500).json({ error: err.message });
    }
  });

    app.post("/api/products", authenticateToken, (req, res) => {
      try {
        const { description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location, distributor, alt_code } = req.body;
        const info = db.prepare("INSERT INTO products (user_id, description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location, distributor, alt_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(req.user!.id, description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location, distributor, alt_code);
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

  app.put("/api/products/bulk-stock-update", authenticateToken, (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Parâmetro 'items' deve ser um array." });
      }

      const updateStmt = db.prepare("UPDATE products SET stock = ? WHERE id = ? AND user_id = ?");
      
      const transaction = db.transaction((itemsList) => {
        for (const item of itemsList) {
          updateStmt.run(item.stock, item.id, req.user!.id);
        }
      });

      transaction(items);
      res.json({ success: true });
    } catch (err: any) {
      console.error('ERRO AO ATUALIZAR ESTOQUE EM LOTE:', err);
      res.status(500).json({ error: err.message });
    }
  });

    app.put("/api/products/:id", authenticateToken, (req, res) => {
      try {
        const { description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location, distributor, alt_code } = req.body;
        db.prepare("UPDATE products SET description = ?, sku = ?, barcode = ?, purchase_price = ?, sale_price = ?, stock = ?, unit = ?, image_url = ?, image_url2 = ?, image_url3 = ?, image_url4 = ?, brand = ?, application = ?, category = ?, location = ?, distributor = ?, alt_code = ? WHERE id = ? AND user_id = ?")
          .run(description, sku, barcode, purchase_price, sale_price, stock, unit, image_url, image_url2, image_url3, image_url4, brand, application, category, location, distributor, alt_code, req.params.id, req.user!.id);
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
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    let query = "SELECT * FROM sales WHERE user_id = ?";
    const params: any[] = [req.user!.id];

    if (startDate) {
      query += " AND date >= ?";
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += " AND date <= ?";
      params.push(`${endDate} 23:59:59`);
    }

    query += " ORDER BY date DESC";

    if (!startDate && !endDate) {
      query += " LIMIT 200";
    }

    try {
      const sales = db.prepare(query).all(...params) as any[];
      const salesWithItems = sales.map(s => {
        const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(s.id);
        return { ...s, sale_items: items };
      });
      res.json(salesWithItems);
    } catch (err: any) {
      console.error("Erro ao buscar vendas:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/sales", authenticateToken, (req, res) => {
    const { id, customer_id, customer_name, labor_value, commission, mechanic_id, mechanic_name, total, payment_method, payment_status, due_date, paid_date, type, date, moto_details, service_description, status, sale_items, motorcycle_km, motorcycle_id, paid_total } = req.body;
    
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

      db.prepare("INSERT INTO sales (id, user_id, customer_id, customer_name, labor_value, commission, mechanic_id, mechanic_name, total, payment_method, payment_status, due_date, paid_date, type, date, moto_details, service_description, status, paid_total, motorcycle_id, motorcycle_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, req.user!.id, safeCustId, customer_name, safeLabor, safeCommission, safeMechId, mechanic_name, safeTotal, payment_method, payment_status, due_date, paid_date, type, date, moto_details, service_description, status, safePaidTotal, safeMotoId, safeKm);
      
      // 2. Insert Items & Update Stock
      const insertItem = db.prepare("INSERT INTO sale_items (sale_id, product_id, description, quantity, price, type) VALUES (?, ?, ?, ?, ?, ?)");
      const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
      if (sale_items) {
        for (const item of sale_items) {
          const safePrice = parseFloat(item.price) || 0;
          const safeQty = parseInt(item.quantity) || 0;
          const safeProdId = item.product_id ? parseInt(item.product_id) : null;
          insertItem.run(id, safeProdId, item.description, safeQty, safePrice, item.type || 'Peça');
          if (safeProdId && (item.type === 'Peça' || !item.type)) {
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
    const { customer_id, customer_name, labor_value, commission, mechanic_id, mechanic_name, total, payment_method, payment_status, due_date, paid_date, status, moto_details, service_description, sale_items, motorcycle_km, motorcycle_id, paid_total } = req.body;
    
    const runTransaction = db.transaction(() => {
      // 1. Update Sale
      const safeTotal = parseFloat(total);
      const safeLabor = parseFloat(labor_value) || 0;
      const safeCommission = parseFloat(commission) || 0;
      const safePaidTotal = parseFloat(paid_total) || 0;
      const safeKm = parseInt(motorcycle_km) || 0;
      const safeCustId = parseInt(customer_id) || null;
      const safeMechId = parseInt(mechanic_id) || null;
      const safeMotoId = parseInt(motorcycle_id) || null;

      db.prepare("UPDATE sales SET customer_id = ?, customer_name = ?, labor_value = ?, commission = ?, mechanic_id = ?, mechanic_name = ?, total = ?, payment_method = ?, payment_status = ?, due_date = ?, paid_date = ?, status = ?, moto_details = ?, service_description = ?, paid_total = ?, motorcycle_id = ?, motorcycle_km = ? WHERE id = ? AND user_id = ?")
        .run(safeCustId, customer_name, safeLabor, safeCommission, safeMechId, mechanic_name, safeTotal, payment_method, payment_status, due_date, paid_date, status, moto_details, service_description, safePaidTotal, safeMotoId, safeKm, req.params.id, req.user!.id);
      
      // 2. Reversal logic for stock
      const oldItems = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(req.params.id) as any[];
      const updateStockAdd = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
      for(const item of oldItems) {
        if(item.product_id && (item.type === 'Peça' || !item.type)) {
          updateStockAdd.run(item.quantity, item.product_id);
        }
      }

      db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(req.params.id);

      if (sale_items) {
        const insertItem = db.prepare("INSERT INTO sale_items (sale_id, product_id, description, quantity, price, type) VALUES (?, ?, ?, ?, ?, ?)");
        const updateStockSub = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
        for (const item of sale_items) {
          const safePrice = parseFloat(item.price) || 0;
          const safeQty = parseInt(item.quantity) || 0;
          const safeProdId = item.product_id ? parseInt(item.product_id) : null;
          insertItem.run(req.params.id, safeProdId, item.description, safeQty, safePrice, item.type || 'Peça');
          if (safeProdId && (item.type === 'Peça' || !item.type)) {
            updateStockSub.run(safeQty, safeProdId);
          }
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
        if(item.product_id && (item.type === 'Peça' || !item.type)) {
          updateStock.run(item.quantity, item.product_id);
        }
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

  // ==========================================
  // CRM API ROUTES
  // ==========================================

  // Clientes CRM (Syncs with customers and motorcycles)
  app.get("/api/clientes", authenticateToken, (req, res) => {
    try {
      const data = db.prepare(`SELECT * FROM clientes WHERE user_id = ? ORDER BY nome ASC`).all(req.user!.id);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/clientes", authenticateToken, (req, res) => {
    const { nome, telefone, cpf_cnpj, cidade, endereco, modelo_moto, ano_moto, placa_moto, observacoes, status } = req.body;
    const userId = req.user!.id;
    try {
      const run = db.transaction(() => {
        // 1. Write to customers
        const custInfo = db.prepare("INSERT INTO customers (user_id, name, whatsapp, address, city, cpf) VALUES (?, ?, ?, ?, ?, ?)")
          .run(userId, nome, telefone, endereco, cidade, cpf_cnpj);
        const customerId = custInfo.lastInsertRowid;

        // 2. Write to motorcycles
        if (modelo_moto || placa_moto) {
          db.prepare("INSERT INTO motorcycles (user_id, customer_id, model, plate) VALUES (?, ?, ?, ?)")
            .run(userId, customerId, modelo_moto || 'N/A', placa_moto || 'N/A');
        }

        // 3. Write to clientes
        db.prepare(`
          INSERT INTO clientes (id, user_id, nome, telefone, cpf_cnpj, cidade, endereco, modelo_moto, ano_moto, placa_moto, observacoes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(customerId, userId, nome, telefone, cpf_cnpj, cidade, endereco, modelo_moto, ano_moto, placa_moto, observacoes, status || 'Novo');

        return customerId;
      });

      const id = run();
      res.json({ id, nome, telefone, status: status || 'Novo' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/clientes/:id", authenticateToken, (req, res) => {
    const { nome, telefone, cpf_cnpj, cidade, endereco, modelo_moto, ano_moto, placa_moto, observacoes, status } = req.body;
    const userId = req.user!.id;
    const clienteId = req.params.id;
    try {
      const run = db.transaction(() => {
        db.prepare("UPDATE customers SET name = ?, whatsapp = ?, address = ?, city = ?, cpf = ? WHERE id = ? AND user_id = ?")
          .run(nome, telefone, endereco, cidade, cpf_cnpj, clienteId, userId);

        const existingMoto = db.prepare("SELECT id FROM motorcycles WHERE customer_id = ?").get(clienteId);
        if (existingMoto) {
          db.prepare("UPDATE motorcycles SET model = ?, plate = ? WHERE customer_id = ?")
            .run(modelo_moto || 'N/A', placa_moto || 'N/A', clienteId);
        } else if (modelo_moto || placa_moto) {
          db.prepare("INSERT INTO motorcycles (user_id, customer_id, model, plate) VALUES (?, ?, ?, ?)")
            .run(userId, clienteId, modelo_moto || 'N/A', placa_moto || 'N/A');
        }

        db.prepare(`
          UPDATE clientes 
          SET nome = ?, telefone = ?, cpf_cnpj = ?, cidade = ?, endereco = ?, modelo_moto = ?, ano_moto = ?, placa_moto = ?, observacoes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).run(nome, telefone, cpf_cnpj, cidade, endereco, modelo_moto, ano_moto, placa_moto, observacoes, status, clienteId, userId);
      });

      run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/clientes/:id", authenticateToken, (req, res) => {
    const userId = req.user!.id;
    const clienteId = req.params.id;
    try {
      const run = db.transaction(() => {
        db.prepare("DELETE FROM customers WHERE id = ? AND user_id = ?").run(clienteId, userId);
        db.prepare("DELETE FROM motorcycles WHERE customer_id = ?").run(clienteId);
        db.prepare("DELETE FROM clientes WHERE id = ? AND user_id = ?").run(clienteId, userId);
        db.prepare("DELETE FROM atendimentos WHERE cliente_id = ?").run(clienteId);
      });
      run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Atendimentos e Conversas
  app.get("/api/atendimentos", authenticateToken, (req, res) => {
    try {
      const data = db.prepare(`
        SELECT a.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.modelo_moto as cliente_moto, c.status as cliente_status
        FROM atendimentos a
        JOIN clientes c ON a.cliente_id = c.id
        WHERE a.user_id = ?
        ORDER BY a.last_contact DESC
      `).all(req.user!.id);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/atendimentos", authenticateToken, (req, res) => {
    const { cliente_id, status, atendente_name, observacoes } = req.body;
    const userId = req.user!.id;
    try {
      // Check if open chat already exists
      const existing = db.prepare("SELECT id FROM atendimentos WHERE cliente_id = ? AND user_id = ? AND status != 'Finalizado'").get(cliente_id) as any;
      if (existing) {
        return res.json({ id: existing.id, is_existing: true });
      }

      const info = db.prepare("INSERT INTO atendimentos (user_id, cliente_id, status, atendente_name, observacoes) VALUES (?, ?, ?, ?, ?)")
        .run(userId, cliente_id, status || 'Novo', atendente_name, observacoes);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update last contact timestamp / status
  app.put("/api/atendimentos/:id", authenticateToken, (req, res) => {
    const { status, atendente_name, observacoes } = req.body;
    const userId = req.user!.id;
    try {
      db.prepare("UPDATE atendimentos SET status = ?, atendente_name = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
        .run(status, atendente_name, observacoes, req.params.id, userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/conversas/:atendimentoId", authenticateToken, (req, res) => {
    try {
      const data = db.prepare("SELECT * FROM conversas WHERE atendimento_id = ? AND user_id = ? ORDER BY created_at ASC").all(req.params.atendimentoId, req.user!.id);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/conversas", authenticateToken, (req, res) => {
    const { atendimento_id, sender, message } = req.body;
    const userId = req.user!.id;
    try {
      const run = db.transaction(() => {
        const info = db.prepare("INSERT INTO conversas (user_id, atendimento_id, sender, message) VALUES (?, ?, ?, ?)")
          .run(userId, atendimento_id, sender, message);
        
        // Update last contact timestamp in atendimento
        db.prepare("UPDATE atendimentos SET last_contact = CURRENT_TIMESTAMP, status = ? WHERE id = ?")
          .run(sender === 'atendente' ? 'Aguardando cliente' : 'Em atendimento', atendimento_id);
        
        return info.lastInsertRowid;
      });

      const id = run();
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Orçamentos
  app.get("/api/orcamentos", authenticateToken, (req, res) => {
    try {
      const quotes = db.prepare("SELECT * FROM orcamentos WHERE user_id = ? ORDER BY created_at DESC").all(req.user!.id) as any[];
      const fullQuotes = quotes.map(q => {
        const items = db.prepare("SELECT * FROM orcamento_itens WHERE orcamento_id = ?").all(q.id);
        return { ...q, items };
      });
      res.json(fullQuotes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/orcamentos", authenticateToken, (req, res) => {
    const { cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, service_description, labor_value, discount, total_value, payment_method, observacoes, status, items } = req.body;
    const userId = req.user!.id;
    try {
      const run = db.transaction(() => {
        // 1. Insert into quotes (old compatibility)
        const quoteInfo = db.prepare(`
          INSERT INTO quotes (user_id, customer_id, customer_name, motorcycle_details, total_value, observations, status, items)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, cliente_id, customer_name, motorcycle_details, total_value, observacoes, status || 'Pendente', JSON.stringify(items || []));
        const quoteId = quoteInfo.lastInsertRowid;

        // 2. Insert into orcamentos (new CRM table)
        db.prepare(`
          INSERT INTO orcamentos (id, user_id, cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, service_description, labor_value, discount, total_value, payment_method, observacoes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(quoteId, userId, cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, service_description, labor_value || 0, discount || 0, total_value, payment_method, observacoes, status || 'Pendente');

        // 3. Insert items
        const insertItem = db.prepare(`
          INSERT INTO orcamento_itens (orcamento_id, description, quantity, unit_value, total_value)
          VALUES (?, ?, ?, ?, ?)
        `);
        if (Array.isArray(items)) {
          for (const item of items) {
            insertItem.run(quoteId, item.description, item.quantity, item.price || item.unit_value, (item.price || item.unit_value) * item.quantity);
          }
        }
        return quoteId;
      });

      const id = run();
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/orcamentos/:id", authenticateToken, (req, res) => {
    const { cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, service_description, labor_value, discount, total_value, payment_method, observacoes, status, items } = req.body;
    const userId = req.user!.id;
    const quoteId = req.params.id;
    try {
      const run = db.transaction(() => {
        // 1. Update quotes
        db.prepare(`
          UPDATE quotes 
          SET customer_id = ?, customer_name = ?, motorcycle_details = ?, total_value = ?, observations = ?, status = ?, items = ?
          WHERE id = ? AND user_id = ?
        `).run(cliente_id, customer_name, motorcycle_details, total_value, observacoes, status, JSON.stringify(items || []), quoteId, userId);

        // 2. Update orcamentos
        db.prepare(`
          UPDATE orcamentos 
          SET cliente_id = ?, customer_name = ?, whatsapp = ?, motorcycle_details = ?, motorcycle_year = ?, service_description = ?, labor_value = ?, discount = ?, total_value = ?, payment_method = ?, observacoes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).run(cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, service_description, labor_value || 0, discount || 0, total_value, payment_method, observacoes, status, quoteId, userId);

        // 3. Re-create items
        db.prepare("DELETE FROM orcamento_itens WHERE orcamento_id = ?").run(quoteId);
        const insertItem = db.prepare(`
          INSERT INTO orcamento_itens (orcamento_id, description, quantity, unit_value, total_value)
          VALUES (?, ?, ?, ?, ?)
        `);
        if (Array.isArray(items)) {
          for (const item of items) {
            insertItem.run(quoteId, item.description, item.quantity, item.price || item.unit_value, (item.price || item.unit_value) * item.quantity);
          }
        }
      });

      run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/orcamentos/:id", authenticateToken, (req, res) => {
    const userId = req.user!.id;
    const quoteId = req.params.id;
    try {
      const run = db.transaction(() => {
        db.prepare("DELETE FROM quotes WHERE id = ? AND user_id = ?").run(quoteId, userId);
        db.prepare("DELETE FROM orcamentos WHERE id = ? AND user_id = ?").run(quoteId, userId);
        db.prepare("DELETE FROM orcamento_itens WHERE orcamento_id = ?").run(quoteId);
      });
      run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Serviços da Oficina (Syncs with sales and sale_items)
  app.get("/api/servicos_oficina", authenticateToken, (req, res) => {
    try {
      const data = db.prepare("SELECT * FROM servicos_oficina WHERE user_id = ? ORDER BY entry_date DESC").all(req.user!.id) as any[];
      const fullServices = data.map(sv => {
        const items = db.prepare("SELECT * FROM servico_pecas WHERE servico_id = ?").all(sv.id);
        return { ...sv, items };
      });
      res.json(fullServices);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/servicos_oficina", authenticateToken, (req, res) => {
    const { cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, motorcycle_plate, service_requested, mechanic_id, mechanic_name, status, entry_date, delivery_forecast, labor_value, parts_value, total_value, observacoes, items } = req.body;
    const userId = req.user!.id;
    try {
      const run = db.transaction(() => {
        // 1. Generate unique OS ID for sales table
        const osId = `OS-${Date.now()}`;

        // 2. Insert into sales table
        db.prepare(`
          INSERT INTO sales (id, user_id, customer_id, customer_name, labor_value, mechanic_id, mechanic_name, total, payment_method, payment_status, type, date, moto_details, service_description, status, whatsapp, motorcycle_km)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(osId, userId, cliente_id, customer_name, labor_value || 0, mechanic_id, mechanic_name, total_value, 'Pix', 'Pendente', 'Oficina', entry_date || new Date().toISOString(), `${motorcycle_details} (${motorcycle_year || ''}) - Placa: ${motorcycle_plate || ''}`, service_requested, 'Aberto', whatsapp, 0);

        // 3. Insert sale_items and update stock
        const insertSaleItem = db.prepare("INSERT INTO sale_items (sale_id, product_id, description, quantity, price, type) VALUES (?, ?, ?, ?, ?, ?)");
        const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
        if (Array.isArray(items)) {
          for (const item of items) {
            insertSaleItem.run(osId, item.product_id, item.description, item.quantity, item.price || item.unit_value, 'Peça');
            if (item.product_id) {
              updateStock.run(item.quantity, item.product_id);
            }
          }
        }

        // 4. Insert into servicos_oficina (CRM table)
        const svInfo = db.prepare(`
          INSERT INTO servicos_oficina (user_id, cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, motorcycle_plate, service_requested, mechanic_id, mechanic_name, status, entry_date, delivery_forecast, labor_value, parts_value, total_value, observacoes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, motorcycle_plate, service_requested, mechanic_id, mechanic_name, status || 'Aguardando avaliação', entry_date, delivery_forecast, labor_value || 0, parts_value || 0, total_value, observacoes);
        const servicoId = svInfo.lastInsertRowid;

        // 5. Insert into servico_pecas
        const insertPeca = db.prepare(`
          INSERT INTO servico_pecas (servico_id, product_id, description, quantity, price)
          VALUES (?, ?, ?, ?, ?)
        `);
        if (Array.isArray(items)) {
          for (const item of items) {
            insertPeca.run(servicoId, item.product_id, item.description, item.quantity, item.price || item.unit_value);
          }
        }
        return servicoId;
      });

      const id = run();
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/servicos_oficina/:id", authenticateToken, (req, res) => {
    const { cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, motorcycle_plate, service_requested, mechanic_id, mechanic_name, status, entry_date, delivery_forecast, labor_value, parts_value, total_value, observacoes, items } = req.body;
    const userId = req.user!.id;
    const servicoId = req.params.id;
    try {
      const run = db.transaction(() => {
        // Update servicos_oficina
        db.prepare(`
          UPDATE servicos_oficina 
          SET cliente_id = ?, customer_name = ?, whatsapp = ?, motorcycle_details = ?, motorcycle_year = ?, motorcycle_plate = ?, service_requested = ?, mechanic_id = ?, mechanic_name = ?, status = ?, entry_date = ?, delivery_forecast = ?, labor_value = ?, parts_value = ?, total_value = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).run(cliente_id, customer_name, whatsapp, motorcycle_details, motorcycle_year, motorcycle_plate, service_requested, mechanic_id, mechanic_name, status, entry_date, delivery_forecast, labor_value || 0, parts_value || 0, total_value, observacoes, servicoId, userId);

        // Re-create parts
        db.prepare("DELETE FROM servico_pecas WHERE servico_id = ?").run(servicoId);
        const insertPeca = db.prepare(`
          INSERT INTO servico_pecas (servico_id, product_id, description, quantity, price)
          VALUES (?, ?, ?, ?, ?)
        `);
        if (Array.isArray(items)) {
          for (const item of items) {
            insertPeca.run(servicoId, item.product_id, item.description, item.quantity, item.price || item.unit_value);
          }
        }
      });

      run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/servicos_oficina/:id", authenticateToken, (req, res) => {
    const userId = req.user!.id;
    const servicoId = req.params.id;
    try {
      const run = db.transaction(() => {
        db.prepare("DELETE FROM servicos_oficina WHERE id = ? AND user_id = ?").run(servicoId, userId);
        db.prepare("DELETE FROM servico_pecas WHERE servico_id = ?").run(servicoId);
      });
      run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Mensagens Prontas
  app.get("/api/mensagens_prontas", authenticateToken, (req, res) => {
    try {
      const data = db.prepare("SELECT * FROM mensagens_prontas WHERE user_id = ? ORDER BY category ASC, title ASC").all(req.user!.id);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/mensagens_prontas", authenticateToken, (req, res) => {
    const { category, title, content } = req.body;
    const userId = req.user!.id;
    try {
      const info = db.prepare("INSERT INTO mensagens_prontas (user_id, category, title, content) VALUES (?, ?, ?, ?)")
        .run(userId, category, title, content);
      res.json({ id: info.lastInsertRowid, category, title, content });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/mensagens_prontas/:id", authenticateToken, (req, res) => {
    const { category, title, content } = req.body;
    const userId = req.user!.id;
    try {
      db.prepare("UPDATE mensagens_prontas SET category = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
        .run(category, title, content, req.params.id, userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/mensagens_prontas/:id", authenticateToken, (req, res) => {
    const userId = req.user!.id;
    try {
      db.prepare("DELETE FROM mensagens_prontas WHERE id = ? AND user_id = ?").run(req.params.id, userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Tags e Cliente_Tags
  app.get("/api/tags", authenticateToken, (req, res) => {
    try {
      const data = db.prepare("SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC").all(req.user!.id);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tags", authenticateToken, (req, res) => {
    const { name, color } = req.body;
    const userId = req.user!.id;
    try {
      const info = db.prepare("INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)")
        .run(userId, name, color || 'bg-slate-100 text-slate-800');
      res.json({ id: info.lastInsertRowid, name, color });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tags/:id", authenticateToken, (req, res) => {
    const userId = req.user!.id;
    try {
      db.prepare("DELETE FROM tags WHERE id = ? AND user_id = ?").run(req.params.id, userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/cliente_tags", authenticateToken, (req, res) => {
    try {
      const data = db.prepare(`
        SELECT ct.*, t.name as tag_name, t.color as tag_color 
        FROM cliente_tags ct
        JOIN tags t ON ct.tag_id = t.id
        WHERE t.user_id = ?
      `).all(req.user!.id);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/cliente_tags", authenticateToken, (req, res) => {
    const { cliente_id, tag_id } = req.body;
    try {
      const existing = db.prepare("SELECT id FROM cliente_tags WHERE cliente_id = ? AND tag_id = ?").get(cliente_id, tag_id);
      if (existing) return res.json({ success: true });

      const info = db.prepare("INSERT INTO cliente_tags (cliente_id, tag_id) VALUES (?, ?)").run(cliente_id, tag_id);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/cliente_tags/:cliente_id/:tag_id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM cliente_tags WHERE cliente_id = ? AND tag_id = ?").run(req.params.cliente_id, req.params.tag_id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Followups automáticos
  app.get("/api/followups/reminders", authenticateToken, (req, res) => {
    const userId = req.user!.id;
    try {
      const reminders: any[] = [];

      // 1. Cliente sem resposta há 1 dia (Atendimento aberto, última mensagem do cliente > 24h atrás)
      const semResposta = db.prepare(`
        SELECT a.*, c.nome, c.telefone, c.modelo_moto
        FROM atendimentos a
        JOIN clientes c ON a.cliente_id = c.id
        WHERE a.user_id = ? AND a.status != 'Finalizado' AND datetime(a.last_contact) < datetime('now', '-1 day')
      `).all(userId) as any[];
      semResposta.forEach(item => {
        reminders.push({
          type: 'sem_resposta_1d',
          title: 'Cliente sem resposta há mais de 1 dia',
          description: `${item.nome} (${item.cliente_moto || item.modelo_moto || 'Moto'}) aguarda retorno.`,
          whatsapp: item.telefone,
          name: item.nome,
          detail: item
        });
      });

      // 2. Orçamento enviado há 2 dias sem retorno
      const orcamentosPendentes = db.prepare(`
        SELECT o.*
        FROM orcamentos o
        WHERE o.user_id = ? AND o.status = 'Enviado' AND datetime(o.created_at) < datetime('now', '-2 days')
      `).all(userId) as any[];
      orcamentosPendentes.forEach(item => {
        reminders.push({
          type: 'orcamento_no_return_2d',
          title: 'Orçamento pendente de retorno (2 dias)',
          description: `Orçamento de R$ ${item.total_value.toFixed(2)} para ${item.customer_name}.`,
          whatsapp: item.whatsapp,
          name: item.customer_name,
          detail: item
        });
      });

      // 3. Cliente que comprou óleo há mais de 30 dias (baseado nas vendas da Kombat)
      const oleoClientes = db.prepare(`
        SELECT s.customer_name, s.whatsapp, MAX(s.date) as last_oil_date
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.user_id = ? AND (si.description LIKE '%óleo%' OR si.description LIKE '%oleo%') AND s.whatsapp IS NOT NULL
        GROUP BY s.customer_name, s.whatsapp
        HAVING datetime(last_oil_date) < datetime('now', '-30 days')
      `).all(userId) as any[];
      oleoClientes.forEach(item => {
        reminders.push({
          type: 'oleo_30d',
          title: 'Troca de Óleo - Mais de 30 dias',
          description: `${item.customer_name} comprou óleo pela última vez em ${new Date(item.last_oil_date).toLocaleDateString('pt-BR')}.`,
          whatsapp: item.whatsapp,
          name: item.customer_name,
          detail: item
        });
      });

      // 4. Cliente que fez serviço há mais de 7 dias (agradecimento / pós-venda)
      const servicoRecente = db.prepare(`
        SELECT sv.*
        FROM servicos_oficina sv
        WHERE sv.user_id = ? AND sv.status IN ('Finalizado', 'Entregue') AND datetime(sv.updated_at) < datetime('now', '-7 days')
      `).all(userId) as any[];
      servicoRecente.forEach(item => {
        reminders.push({
          type: 'servico_7d',
          title: 'Acompanhamento Pós-Serviço (7 dias)',
          description: `Revisão de ${item.service_requested} realizada para ${item.customer_name}. Enviar pós-venda.`,
          whatsapp: item.whatsapp,
          name: item.customer_name,
          detail: item
        });
      });

      // 5. Cliente que pediu peça e não comprou (leads de interesse em peças parados)
      const pecaNaoComprada = db.prepare(`
        SELECT l.*
        FROM leads l
        WHERE l.user_id = ? AND (l.interest LIKE '%peça%' OR l.interest LIKE '%peca%') AND l.status IN ('Novo', 'Em atendimento', 'Aguardando cliente', 'Negociação') AND datetime(l.created_at) < datetime('now', '-5 days')
      `).all(userId) as any[];
      pecaNaoComprada.forEach(item => {
        reminders.push({
          type: 'peca_nao_comprada',
          title: 'Peça pedida sem compra finalizada',
          description: `${item.name} procurou peças há mais de 5 dias. Checar se ainda precisa da peça.`,
          whatsapp: item.phone,
          name: item.name,
          detail: item
        });
      });

      res.json(reminders);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Gestão de Usuários
  app.get("/api/usuarios", authenticateToken, (req, res) => {
    try {
      const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user!.id) as any;
      if (!user || user.role !== 'Administrador') {
        return res.status(403).json({ error: "Apenas Administradores podem acessar a gestão de usuários." });
      }
      const allUsers = db.prepare("SELECT id, username, role, created_at FROM users").all();
      res.json(allUsers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/usuarios/:id/role", authenticateToken, (req, res) => {
    try {
      const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user!.id) as any;
      if (!user || user.role !== 'Administrador') {
        return res.status(403).json({ error: "Apenas Administradores podem alterar permissões." });
      }
      const { role } = req.body;
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/usuarios/:id", authenticateToken, (req, res) => {
    try {
      const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user!.id) as any;
      if (!user || user.role !== 'Administrador') {
        return res.status(403).json({ error: "Apenas Administradores podem excluir usuários." });
      }
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // IA KOMBAT & CLIENTE 360° ROUTES
  // ==========================================

  // Helper to log AI requests
  const logAiRequest = (userId: number, clienteId: number | null, acao: string, origem: string, resumo: string) => {
    try {
      db.prepare(`
        INSERT INTO ai_logs (user_id, cliente_id, acao, origem, resumo)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, clienteId, acao, origem, resumo.substring(0, 1000));
    } catch (e) {
      console.error("[IA] Error logging AI request:", e);
    }
  };

  // Helper to mask sensitive customer data for privacy before sending to AI
  const maskSensitiveData = (c360: any) => {
    const cloned = JSON.parse(JSON.stringify(c360));
    if (cloned.cliente) {
      if (cloned.cliente.cpf_cnpj) {
        cloned.cliente.cpf_cnpj = cloned.cliente.cpf_cnpj.replace(/^(\d{3}).*(\d{2})$/, "$1.***.***-$2");
      }
      if (cloned.cliente.telefone) {
        cloned.cliente.telefone = cloned.cliente.telefone.replace(/^(\d{2})(\d{1})?(\d{4})(\d{4})$/, "($1) $2****-$4");
      }
      if (cloned.cliente.whatsapp) {
        cloned.cliente.whatsapp = cloned.cliente.whatsapp.replace(/^(\d{2})(\d{1})?(\d{4})(\d{4})$/, "($1) $2****-$4");
      }
      cloned.cliente.endereco = "Mascarado para Privacidade";
      cloned.cliente.cidade = "Mascarada para Privacidade";
    }
    return cloned;
  };

  // General helper to call Gemini
  const callGemini = async (promptText: string, contextJson: string): Promise<{ text: string; success: boolean }> => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return { text: "", success: false };
    }

    try {
      const aiInstance = new GoogleGenAI({ apiKey: geminiKey });
      const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          `Você é a IA Kombat, assistente comercial da Kombat Moto Peças.
Seu objetivo é ajudar no atendimento, vendas, oficina, pós-venda e organização do histórico do cliente.
Responda sempre em português do Brasil, com linguagem simples, objetiva e comercial.
Nunca invente valores, peças, estoques ou histórico.
Use apenas os dados fornecidos pelo sistema.
Quando faltar informação, diga que precisa confirmar no estoque ou com o cliente.
Não execute ações sozinho. Apenas sugira próximos passos.

Abaixo está o contexto do cliente em formato JSON:
${contextJson}

Instrução específica da solicitação:
${promptText}`,
        ],
      });

      if (response.text) {
        return { text: response.text.trim(), success: true };
      }
      return { text: "", success: false };
    } catch (e: any) {
      console.error("[IA] Gemini call failed:", e);
      return { text: "", success: false };
    }
  };

  // Local heuristics for AI fallback
  const getLocalFallbackAnalysis = (acao: string, c360: any, extraParam?: string) => {
    const cliente = c360.cliente;
    const name = cliente?.nome || "Cliente";
    const motos = c360.motos || [];
    const motoModel = motos.length > 0 ? motos[0].model : "Moto";
    const sales = c360.sales || [];
    const quotes = c360.quotes || [];
    const summary = c360.financialSummary || {};

    if (acao === 'resumo') {
      const motoList = motos.map((m: any) => `${m.brand || ''} ${m.model || ''} (${m.plate || ''})`).join(', ') || 'Nenhuma moto registrada';
      return `### 📄 Resumo do Cliente (Modo Local)
**Cliente:** ${name}
**Motos:** ${motoList}
**Faturamento Total:** ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalSpent || 0)} (Balcão: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((summary.totalSpent || 0) - (summary.totalOficina || 0))} | Oficina: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalOficina || 0)})
**Frequência:** ${summary.buyCount || 0} compras realizadas com Ticket Médio de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.ticketMedio || 0)}.
**Última Visita:** ${summary.ultimaVisitaDate ? new Date(summary.ultimaVisitaDate).toLocaleDateString('pt-BR') : 'Sem registro'}.
**Status de Crédito:** Limite de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.credit_limit || 0)} com débito de em aberto de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.valorEmAberto || 0)}.`;
    }

    if (acao === 'oportunidades') {
      const suggestions: string[] = [];
      
      // Heuristic 1: Oil change check
      const oilChanges = sales.filter((s: any) => 
        (s.sale_items || s.items || []).some((i: any) => (i.description || '').toLowerCase().includes('óleo') || (i.description || '').toLowerCase().includes('oleo'))
      );
      if (oilChanges.length > 0) {
        const lastOil = new Date(oilChanges[0].date);
        const days = (Date.now() - lastOil.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 30) {
          suggestions.push(`🚨 **Troca de Óleo Preventiva:** Faz mais de ${Math.round(days)} dias desde a última troca de óleo registrada (${lastOil.toLocaleDateString('pt-BR')}). Sugira o agendamento da troca para evitar desgaste do motor.`);
        }
      } else {
        suggestions.push(`跑 **Troca de Óleo:** Não encontramos registro de troca de óleo para este cliente. Ofereça óleo de motor recomendado para a ${motoModel}.`);
      }

      // Heuristic 2: Pneu check
      const boughtFrontPneu = sales.some((s: any) => 
        (s.sale_items || s.items || []).some((i: any) => (i.description || '').toLowerCase().includes('pneu dianteiro') || (i.description || '').toLowerCase().includes('diant'))
      );
      const boughtBackPneu = sales.some((s: any) => 
        (s.sale_items || s.items || []).some((i: any) => (i.description || '').toLowerCase().includes('pneu traseiro') || (i.description || '').toLowerCase().includes('tras'))
      );
      if (boughtFrontPneu && !boughtBackPneu) {
        suggestions.push(`🛒 **Venda Casada (Pneu Traseiro):** Cliente comprou pneu dianteiro recentemente. Ofereça o pneu traseiro equivalente da mesma marca (Pirelli/Rinaldi) com desconto especial.`);
      }

      // Heuristic 3: Relation Kit
      const boughtRelation = sales.some((s: any) => 
        (s.sale_items || s.items || []).some((i: any) => (i.description || '').toLowerCase().includes('relação') || (i.description || '').toLowerCase().includes('relacao') || (i.description || '').toLowerCase().includes('kit corr'))
      );
      if (boughtRelation) {
        suggestions.push(`✨ **Manutenção da Relação:** Cliente adquiriu kit de relação recentemente. Recomende lubrificante de corrente profissional (Motul C3 / Mobil Chain Lube) para prolongar a vida útil.`);
      }

      if (suggestions.length === 0) {
        suggestions.push(`💡 **Revisão Preventiva Geral:** Sugira uma revisão geral preventiva para a moto ${motoModel} cobrindo freios, suspensão e parte elétrica.`);
      }

      return `### 📈 Oportunidades de Venda (Modo Local)\n\n` + suggestions.join('\n\n');
    }

    if (acao === 'diagnostico') {
      const items: string[] = [];
      const now = Date.now();
      
      // Inactivity check
      if (summary.ultimaVisitaDate) {
        const lastVisit = new Date(summary.ultimaVisitaDate).getTime();
        const days = (now - lastVisit) / (1000 * 60 * 60 * 24);
        if (days > 90) {
          items.push(`⚠️ **Cliente Inativo (Chamar WhatsApp):** Cliente sem visitas ou compras na Kombat há mais de 90 dias (última visita em ${new Date(summary.ultimaVisitaDate).toLocaleDateString('pt-BR')}).`);
        }
      }

      // Pending Quotes
      const pendingQuotes = quotes.filter((q: any) => q.status === 'Pendente' || q.status === 'Enviado');
      if (pendingQuotes.length > 0) {
        items.push(`📋 **Orçamentos Pendentes:** Constam ${pendingQuotes.length} orçamentos enviados e pendentes de retorno comercial.`);
      }

      // Workshop delay
      const lastService = sales.filter((s: any) => s.type === 'Oficina');
      if (lastService.length > 0) {
        const lastOS = new Date(lastService[0].date).getTime();
        const months = (now - lastOS) / (1000 * 60 * 60 * 24 * 30);
        if (months > 8) {
          items.push(`🔧 **Ausência de Oficina:** Moto ${motoModel} não realiza revisões ou serviços há mais de 8 meses (último serviço em ${new Date(lastService[0].date).toLocaleDateString('pt-BR')}).`);
        }
      }

      if (items.length === 0) {
        items.push(`✅ **Cliente Engajado:** O cliente tem comparecido com frequência ideal e não possui pendências registradas.`);
      }

      return `### 🔧 Diagnóstico Comercial (Modo Local)\n\n` + items.join('\n\n');
    }

    if (acao === 'whatsapp') {
      const type = extraParam || 'pos_venda';
      const storeAddress = "Rua Paraná, 342, Centro, Andirá – PR";
      const storePhone = "43 3538-4537";

      if (type === 'orcamento') {
        const pending = quotes.length > 0 ? quotes[0] : null;
        const totalStr = pending ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pending.total_value) : "R$ 0,00";
        return `Olá, ${name}! Tudo certo?\n\nPassando para te enviar o orçamento da Kombat Moto Peças para a sua moto ${motoModel}:\n• Total do Orçamento: ${totalStr}\n\nPodemos fechar e agendar o serviço ou separar as peças para você? Ficamos no seu aguardo! 🏍️`;
      }
      if (type === 'pos_venda') {
        return `Olá, ${name}!\n\nPassando para saber se ficou tudo certo com a sua moto ${motoModel} após o último serviço que realizamos aqui na Kombat Moto Peças. Qualquer coisa, estamos à inteira disposição!`;
      }
      if (type === 'cobranca') {
        const openVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.valorEmAberto || 0);
        return `Olá, ${name}!\n\nPassando para lembrar que consta um saldo pendente na Kombat Moto Peças no valor de ${openVal}. Caso precise de dados para Pix ou queira vir acertar no balcão, fique à vontade. Agradecemos a parceria!`;
      }
      if (type === 'moto_pronta') {
        return `Olá, ${name}! Ótimas notícias! 🏍️\n\nA sua moto ${motoModel} já está pronta e com a manutenção concluída. Pode vir retirar aqui na Kombat Moto Peças quando desejar.\n\nEndereço: ${storeAddress}\nTelefone: ${storePhone}`;
      }
      if (type === 'promocao') {
        return `Olá, ${name}! Tudo bem?\n\nPreparamos ofertas especiais de pastilhas, filtros e pneus esta semana na Kombat Moto Peças perfeitos para a sua ${motoModel}! Dê uma passada aqui no balcão ou peça pelo WhatsApp!`;
      }
      if (type === 'retorno') {
        return `Olá, ${name}! Sentimos sua falta aqui na Kombat Moto Peças 🏍️\n\nFaz um tempinho que a sua ${motoModel} não passa por uma revisão. Que tal agendarmos uma checagem preventiva rápida para rodar com segurança?`;
      }
      return `Olá, ${name}! Passando para agradecer pela preferência e desejar um ótimo dia! Kombat Moto Peças.`;
    }

    if (acao === 'recomendacoes') {
      const isHondaCG = motoModel.toLowerCase().includes('cg') || motoModel.toLowerCase().includes('titan') || motoModel.toLowerCase().includes('fan') || motoModel.toLowerCase().includes('cargo');
      const isHondaBiz = motoModel.toLowerCase().includes('biz') || motoModel.toLowerCase().includes('pop');
      
      let recs = "";
      if (isHondaCG) {
        recs = `### 📦 Produtos Recomendados para ${motoModel} (CG/Titan)\n\n1. **Óleo Mobil 20W50 Mineral (ou 10W30 Semi-sintético):** Recomendado a troca regular de 1.000km.\n2. **Pneu Traseiro 90/90-18 Pirelli Mandrake (ou Rinaldi/Vipal):** Excelente tração e durabilidade.\n3. **Kit Relação CG 150/160 DID (Corrente/Coroa/Pinhão):** Alta resistência para o uso diário.\n4. **Pastilha de Freio Dianteiro Cobreq:** Segurança garantida no balcão da Kombat.`;
      } else if (isHondaBiz) {
        recs = `### 📦 Produtos Recomendados para ${motoModel} (Biz/Pop)\n\n1. **Pneu Traseiro 80/100-14 Pirelli Mandrake:** O pneu traseiro clássico da Biz.\n2. **Kit Relação Biz 125 Vini (com retentor):** Longa durabilidade sem ruídos.\n3. **Óleo de Motor Honda 10W30 Semi-sintético:** O lubrificante original da fabricante.\n4. **Lâmpada do Farol Biz 12V 35/35W Osram:** Alta luminosidade para rodar com segurança à noite.`;
      } else {
        recs = `### 📦 Recomendações Gerais Kombat Moto Peças\n\n1. **Óleo de Motor Mobil Super Moto (20W50 ou 10W30):** O lubrificante essencial do balcão.\n2. **Cabo de Embreagem/Freio Vini:** Cabos reforçados para reposição rápida.\n3. **Pastilhas de Freio Cobreq Racing:** Alta performance de frenagem para qualquer modelo de moto.\n4. **Spray Lubrificante de Corrente Mobil:** Protege a relação contra poeira e oxidação.`;
      }
      return recs;
    }

    return `Análise não suportada no modo local.`;
  };

  // Clientes 360° Consolidation API
  app.get("/api/clientes/:id/360", authenticateToken, (req, res) => {
    const clienteId = req.params.id;
    const userId = req.user!.id;
    try {
      // 1. Cliente
      let cliente = db.prepare("SELECT * FROM clientes WHERE id = ? AND user_id = ?").get(clienteId, userId) as any;
      if (!cliente) {
        // Fallback sync if exists in legacy customers table but not in CRM clientes table
        const legacyCustomer = db.prepare("SELECT * FROM customers WHERE id = ? AND user_id = ?").get(clienteId, userId) as any;
        if (legacyCustomer) {
          db.prepare(`
            INSERT INTO clientes (id, user_id, nome, telefone, cpf_cnpj, cidade, endereco, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Novo')
          `).run(clienteId, userId, legacyCustomer.name, legacyCustomer.whatsapp || '', legacyCustomer.cpf || legacyCustomer.cnpj || '', legacyCustomer.city || '', legacyCustomer.address || '');
          cliente = db.prepare("SELECT * FROM clientes WHERE id = ? AND user_id = ?").get(clienteId, userId) as any;
        } else {
          return res.status(404).json({ error: "Cliente não encontrado" });
        }
      }

      // 2. Motos
      const motos = db.prepare("SELECT * FROM motorcycles WHERE customer_id = ? AND user_id = ?").all(clienteId, userId);

      // 3. Quotes
      const quotes = db.prepare("SELECT * FROM orcamentos WHERE cliente_id = ? AND user_id = ? ORDER BY created_at DESC").all(clienteId, userId) as any[];
      const quotesWithItems = quotes.map(q => {
        const items = db.prepare("SELECT * FROM orcamento_itens WHERE orcamento_id = ?").all(q.id);
        return { ...q, items };
      });

      // 4. Sales
      const sales = db.prepare("SELECT * FROM sales WHERE customer_id = ? AND user_id = ? ORDER BY date DESC").all(clienteId, userId) as any[];
      const salesWithItems = sales.map(s => {
        const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(s.id);
        return { ...s, sale_items: items, items }; // support both items and sale_items
      });

      // 5. Credits
      const credits = db.prepare("SELECT * FROM credit WHERE customer_id = ? AND user_id = ? ORDER BY due_date DESC").all(clienteId, userId);

      // 6. Atendimentos
      const atendimentos = db.prepare("SELECT * FROM atendimentos WHERE cliente_id = ? AND user_id = ? ORDER BY last_contact DESC").all(clienteId, userId) as any[];
      const atendimentosWithConversas = atendimentos.map(a => {
        const conversas = db.prepare("SELECT * FROM conversas WHERE atendimento_id = ? AND user_id = ? ORDER BY created_at ASC").all(a.id, userId);
        return { ...a, conversas };
      });

      // 7. Finance summary
      const totalSpent = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const totalOficina = sales.filter(s => s.type === 'Oficina').reduce((sum, s) => sum + (s.total || 0), 0);
      const totalPecas = sales.reduce((sum, s) => {
        const itemsSum = (s.sale_items || s.items || []).filter((i: any) => i.type === 'Peça' || !i.type).reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0);
        return sum + itemsSum;
      }, 0);
      const buyCount = sales.length;
      const ticketMedio = buyCount > 0 ? totalSpent / buyCount : 0;
      const valorEmAberto = credits.filter((c: any) => c.status === 'Atrasado' || c.status === 'Aberto').reduce((sum, c) => sum + (c.original_value || 0), 0);
      const limiteUtilizado = valorEmAberto;
      const ultimaCompraDate = sales.length > 0 ? sales[0].date : null;
      const ultimaVisitaDate = sales.length > 0 ? sales[0].date : (atendimentos.length > 0 ? atendimentos[0].last_contact : null);

      const financialSummary = {
        totalSpent,
        totalOficina,
        totalPecas,
        buyCount,
        ticketMedio,
        limiteUtilizado,
        valorEmAberto,
        ultimaCompraDate,
        ultimaVisitaDate
      };

      res.json({
        cliente,
        motos,
        quotes: quotesWithItems,
        sales: salesWithItems,
        credits,
        atendimentos: atendimentosWithConversas,
        financialSummary
      });
    } catch (e: any) {
      console.error("[360] Error fetching 360 data:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // AI Ask/Query endpoint
  app.post("/api/ai/perguntar", authenticateToken, async (req, res) => {
    const { cliente_id, pergunta } = req.body;
    const userId = req.user!.id;
    if (!cliente_id || !pergunta) {
      return res.status(400).json({ error: "Parâmetros cliente_id e pergunta são obrigatórios." });
    }

    try {
      const dbUser = userId;
      // Get c360 context manually
      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ? AND user_id = ?").get(cliente_id, dbUser) as any;
      if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });

      const motos = db.prepare("SELECT * FROM motorcycles WHERE customer_id = ? AND user_id = ?").all(cliente_id, dbUser);
      const quotes = db.prepare("SELECT * FROM orcamentos WHERE cliente_id = ? AND user_id = ? ORDER BY created_at DESC").all(cliente_id, dbUser) as any[];
      const quotesWithItems = quotes.map(q => ({
        ...q,
        items: db.prepare("SELECT * FROM orcamento_itens WHERE orcamento_id = ?").all(q.id)
      }));
      const sales = db.prepare("SELECT * FROM sales WHERE customer_id = ? AND user_id = ? ORDER BY date DESC").all(cliente_id, dbUser) as any[];
      const salesWithItems = sales.map(s => ({
        ...s,
        items: db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(s.id)
      }));
      const credits = db.prepare("SELECT * FROM credit WHERE customer_id = ? AND user_id = ?").all(cliente_id, dbUser);
      const atendimentos = db.prepare("SELECT * FROM atendimentos WHERE cliente_id = ? AND user_id = ?").all(cliente_id, dbUser);

      // summary
      const totalSpent = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const totalOficina = sales.filter(s => s.type === 'Oficina').reduce((sum, s) => sum + (s.total || 0), 0);
      const buyCount = sales.length;
      const ticketMedio = buyCount > 0 ? totalSpent / buyCount : 0;
      const valorEmAberto = credits.filter((c: any) => c.status === 'Atrasado' || c.status === 'Aberto').reduce((sum, c) => sum + (c.original_value || 0), 0);
      const ultimaVisitaDate = sales.length > 0 ? sales[0].date : (atendimentos.length > 0 ? (atendimentos[0] as any).last_contact : null);

      const c360 = {
        cliente,
        motos,
        quotes: quotesWithItems,
        sales: salesWithItems,
        credits,
        financialSummary: {
          totalSpent,
          totalOficina,
          buyCount,
          ticketMedio,
          valorEmAberto,
          ultimaVisitaDate
        }
      };

      const masked = maskSensitiveData(c360);

      const hasKey = !!process.env.GEMINI_API_KEY;
      if (hasKey) {
        const aiRes = await callGemini(pergunta, JSON.stringify(masked));
        if (aiRes.success) {
          logAiRequest(userId, cliente_id, 'perguntar', 'Gemini', pergunta);
          return res.json({ text: aiRes.text, origem: 'Gemini', status: 'IA Online' });
        }
      }

      // If Gemini offline/failed, return fallback response
      const fallbackText = `**Resposta da IA Kombat (Modo Local):**\n\nDesculpe, o assistente inteligente avançado (Gemini) está temporariamente offline ou a chave de API não foi configurada. No modo local, posso apenas responder às perguntas de ações rápidas através dos botões no painel. Por favor, utilize os botões rápidos para resumir o cliente, gerar oportunidades ou mensagens.`;
      logAiRequest(userId, cliente_id, 'perguntar', 'Fallback Local', pergunta);
      res.json({ text: fallbackText, origem: 'Fallback Local', status: 'IA Offline usando modo local' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Analisar endpoint
  app.post("/api/ai/analisar", authenticateToken, async (req, res) => {
    const { cliente_id, acao, param } = req.body;
    const userId = req.user!.id;
    if (!cliente_id || !acao) {
      return res.status(400).json({ error: "Parâmetros cliente_id e acao são obrigatórios." });
    }

    try {
      const dbUser = userId;
      // Get c360 context manually
      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ? AND user_id = ?").get(cliente_id, dbUser) as any;
      if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });

      const motos = db.prepare("SELECT * FROM motorcycles WHERE customer_id = ? AND user_id = ?").all(cliente_id, dbUser);
      const quotes = db.prepare("SELECT * FROM orcamentos WHERE cliente_id = ? AND user_id = ? ORDER BY created_at DESC").all(cliente_id, dbUser) as any[];
      const quotesWithItems = quotes.map(q => ({
        ...q,
        items: db.prepare("SELECT * FROM orcamento_itens WHERE orcamento_id = ?").all(q.id)
      }));
      const sales = db.prepare("SELECT * FROM sales WHERE customer_id = ? AND user_id = ? ORDER BY date DESC").all(cliente_id, dbUser) as any[];
      const salesWithItems = sales.map(s => ({
        ...s,
        items: db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(s.id)
      }));
      const credits = db.prepare("SELECT * FROM credit WHERE customer_id = ? AND user_id = ?").all(cliente_id, dbUser);
      const atendimentos = db.prepare("SELECT * FROM atendimentos WHERE cliente_id = ? AND user_id = ?").all(cliente_id, dbUser);

      // summary
      const totalSpent = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const totalOficina = sales.filter(s => s.type === 'Oficina').reduce((sum, s) => sum + (s.total || 0), 0);
      const buyCount = sales.length;
      const ticketMedio = buyCount > 0 ? totalSpent / buyCount : 0;
      const valorEmAberto = credits.filter((c: any) => c.status === 'Atrasado' || c.status === 'Aberto').reduce((sum, c) => sum + (c.original_value || 0), 0);
      const ultimaVisitaDate = sales.length > 0 ? sales[0].date : (atendimentos.length > 0 ? (atendimentos[0] as any).last_contact : null);

      const c360 = {
        cliente,
        motos,
        quotes: quotesWithItems,
        sales: salesWithItems,
        credits,
        financialSummary: {
          totalSpent,
          totalOficina,
          buyCount,
          ticketMedio,
          valorEmAberto,
          ultimaVisitaDate
        }
      };

      const masked = maskSensitiveData(c360);

      const hasKey = !!process.env.GEMINI_API_KEY;
      if (hasKey) {
        let promptText = "";
        if (acao === 'resumo') {
          promptText = "Gere um resumo comercial conciso do cliente. Mostre o histórico de compras, motos cadastradas, total gasto, ticket médio e data da última visita em um layout elegante com bullets.";
        } else if (acao === 'oportunidades') {
          promptText = "Analise o histórico de compras e motos do cliente. Sugira oportunidades de vendas de peças e serviços relacionados (por exemplo, se comprou pneu dianteiro mas não traseiro, ou óleo há mais de 30 dias). Retorne em formato de lista.";
        } else if (acao === 'diagnostico') {
          promptText = "Faça um diagnóstico comercial do engajamento do cliente. Verifique se ele está inativo há mais de 90 dias, se há orçamentos pendentes, ou motos sem manutenção na oficina há mais de 8 meses.";
        } else if (acao === 'recomendacoes') {
          promptText = "Sugira 3 a 5 produtos ou peças específicas do nosso estoque que combinem com o modelo da moto do cliente e o seu padrão de compras.";
        } else if (acao === 'whatsapp') {
          promptText = `Gere uma mensagem personalizada e persuasiva de WhatsApp para o cliente. Tipo de mensagem solicitada: ${param || 'pos_venda'}. Insira o nome do cliente, dados da moto e dados da loja: Kombat Moto Peças (Rua Paraná, 342, Centro, Andirá – PR, Tel: 43 3538-4537).`;
        }

        const aiRes = await callGemini(promptText, JSON.stringify(masked));
        if (aiRes.success) {
          logAiRequest(userId, cliente_id, acao, 'Gemini', `Ação: ${acao} ${param || ''}`);
          return res.json({ text: aiRes.text, origem: 'Gemini', status: 'IA Online' });
        }
      }

      // Fallback
      const fallbackText = getLocalFallbackAnalysis(acao, c360, param);
      logAiRequest(userId, cliente_id, acao, 'Fallback Local', `Ação: ${acao} ${param || ''}`);
      res.json({ text: fallbackText, origem: 'Fallback Local', status: 'IA Offline usando modo local' });
    } catch (e: any) {
      console.error("[IA ANALISAR] Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Get AI Logs
  app.get("/api/ai/logs", authenticateToken, (req, res) => {
    try {
      const logs = db.prepare(`
        SELECT l.*, c.nome as cliente_nome, u.username as usuario_nome
        FROM ai_logs l
        LEFT JOIN clientes c ON l.cliente_id = c.id
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT 20
      `).all();
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Global insights dashboard
  app.get("/api/ai/centro-inteligencia", authenticateToken, (req, res) => {
    const userId = req.user!.id;
    try {
      // 1. VIP Clients
      const vips = db.prepare(`
        SELECT c.id, c.nome, c.telefone, c.modelo_moto, SUM(s.total) as total_gasto, COUNT(s.id) as compras_count
        FROM sales s
        JOIN clientes c ON s.customer_id = c.id
        WHERE s.user_id = ?
        GROUP BY c.id
        ORDER BY total_gasto DESC
        LIMIT 5
      `).all(userId);

      // 2. Inactive clients
      const inactives = db.prepare(`
        SELECT c.id, c.nome, c.telefone, c.modelo_moto, MAX(s.date) as ultima_compra
        FROM clientes c
        LEFT JOIN sales s ON s.customer_id = c.id AND s.user_id = ?
        WHERE c.user_id = ?
        GROUP BY c.id
        HAVING ultima_compra IS NULL OR date(ultima_compra) < date('now', '-60 days')
        ORDER BY ultima_compra ASC
        LIMIT 5
      `).all(userId, userId);

      // 3. At-risk clients
      const atRisk = db.prepare(`
        SELECT c.id, c.nome, c.telefone, c.modelo_moto, SUM(s.total) as total_gasto, MAX(s.date) as ultima_compra
        FROM sales s
        JOIN clientes c ON s.customer_id = c.id
        WHERE s.user_id = ?
        GROUP BY c.id
        HAVING total_gasto > 1000 AND (ultima_compra IS NULL OR date(ultima_compra) < date('now', '-30 days'))
        ORDER BY ultima_compra ASC
        LIMIT 5
      `).all(userId);

      // 4. Hot Quotes
      const hotQuotes = db.prepare(`
        SELECT id, customer_name, whatsapp, motorcycle_details, total_value, created_at
        FROM orcamentos
        WHERE user_id = ? AND status = 'Pendente' AND total_value > 200
        ORDER BY total_value DESC
        LIMIT 5
      `).all(userId);

      // 5. Top products
      const topProducts = db.prepare(`
        SELECT description, SUM(quantity) as total_sold, SUM(price * quantity) as revenue
        FROM sale_items
        WHERE sale_id IN (SELECT id FROM sales WHERE user_id = ?) AND (type = 'Peça' OR type IS NULL)
        GROUP BY description
        ORDER BY total_sold DESC
        LIMIT 5
      `).all(userId);

      // 6. Top Services
      const topServices = db.prepare(`
        SELECT description, COUNT(*) as count, SUM(price * quantity) as revenue
        FROM sale_items
        WHERE sale_id IN (SELECT id FROM sales WHERE user_id = ?) AND type = 'Serviço'
        GROUP BY description
        ORDER BY count DESC
        LIMIT 5
      `).all(userId);

      res.json({
        vips,
        inactives,
        atRisk,
        hotQuotes,
        topProducts,
        topServices
      });
    } catch (e: any) {
      console.error("[IA CENTRO] Error:", e);
      res.status(500).json({ error: e.message });
    }
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
    const services = db.prepare("SELECT *, base_price as price FROM registered_services WHERE user_id = ?").all(req.user!.id);
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

  // Workshop Purchases (Entrada de Dados) - UPDATED 2026-04-08
  db.exec(`
    CREATE TABLE IF NOT EXISTS workshop_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      total_value REAL NOT NULL,
      details TEXT,
      installments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  try {
    db.exec(`ALTER TABLE workshop_purchases ADD COLUMN installments TEXT;`);
  } catch (e) {
    // Column already exists
  }

  app.get("/api/workshop_purchases", authenticateToken, (req, res) => {
    const data = db.prepare("SELECT * FROM workshop_purchases WHERE user_id = ? ORDER BY purchase_date DESC").all(req.user!.id);
    res.json(data);
  });

  app.post("/api/workshop_purchases", authenticateToken, (req, res) => {
    const { description, purchase_date, total_value, details, installments } = req.body;
    const info = db.prepare("INSERT INTO workshop_purchases (user_id, description, purchase_date, total_value, details, installments) VALUES (?, ?, ?, ?, ?, ?)")
      .run(req.user!.id, description, purchase_date, total_value, details, JSON.stringify(installments));
    res.json({ id: parseInt(info.lastInsertRowid.toString()) });
  });

  app.delete("/api/workshop_purchases", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM workshop_purchases WHERE user_id = ?").run(req.user!.id);
      res.json({ success: true });
    } catch (err) {
      console.error('SERVER ERROR (CLEAR):', err);
      res.status(500).json({ error: "Erro ao limpar histórico" });
    }
  });

  app.delete("/api/workshop_purchases/:id", authenticateToken, (req, res) => {
    try {
      const result = db.prepare("DELETE FROM workshop_purchases WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Registro não encontrado" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error('SERVER ERROR (DELETE):', err);
      res.status(500).json({ error: "Erro ao excluir compra" });
    }
  });

  // Accounts Payable (Contas a Pagar)
  app.get("/api/accounts_payable", authenticateToken, (req, res) => {
    try {
      const data = db.prepare("SELECT * FROM accounts_payable WHERE user_id = ? ORDER BY due_date ASC").all(req.user!.id);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao carregar contas a pagar: " + err.message });
    }
  });

  app.post("/api/accounts_payable", authenticateToken, (req, res) => {
    try {
      const { fornecedor, valor, due_date, linha_digitavel, codigo_pix, status } = req.body;
      const info = db.prepare(`
        INSERT INTO accounts_payable (user_id, fornecedor, valor, due_date, linha_digitavel, codigo_pix, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.user!.id, fornecedor, valor, due_date, linha_digitavel, codigo_pix, status || 'Pendente');
      res.json({ id: parseInt(info.lastInsertRowid.toString()) });
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao cadastrar conta a pagar: " + err.message });
    }
  });

  app.put("/api/accounts_payable/:id", authenticateToken, (req, res) => {
    try {
      const { fornecedor, valor, due_date, linha_digitavel, codigo_pix, status, paid_date } = req.body;
      db.prepare(`
        UPDATE accounts_payable 
        SET fornecedor = ?, valor = ?, due_date = ?, linha_digitavel = ?, codigo_pix = ?, status = ?, paid_date = ?
        WHERE id = ? AND user_id = ?
      `).run(fornecedor, valor, due_date, linha_digitavel, codigo_pix, status, paid_date, req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao atualizar conta a pagar: " + err.message });
    }
  });

  app.delete("/api/accounts_payable/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM accounts_payable WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao excluir conta a pagar: " + err.message });
    }
  });

  // Helper to calculate module 10 checksum
  function modulo10(block: string) {
    let sum = 0;
    let weight = 2;
    for (let i = block.length - 1; i >= 0; i--) {
      let mul = parseInt(block[i], 10) * weight;
      if (mul >= 10) {
        mul = Math.floor(mul / 10) + (mul % 10);
      }
      sum += mul;
      weight = weight === 2 ? 1 : 2;
    }
    const rem = sum % 10;
    const dv = rem === 0 ? 0 : 10 - rem;
    return dv.toString();
  }

  // Helper to convert 44-digit ITF barcode to standard formatted 47/48-digit line
  function barcodeToLinhaDigitavel(barcode: string) {
    const clean = barcode.replace(/\D/g, "");
    if (clean.length !== 44) return barcode;
    
    if (clean[0] === '8') {
      // Utility bill 44 to 48 digits conversion
      let l1 = clean.substring(0, 11);
      let l2 = clean.substring(11, 22);
      let l3 = clean.substring(22, 33);
      let l4 = clean.substring(33, 44);
      
      let dv1 = modulo10(l1);
      let dv2 = modulo10(l2);
      let dv3 = modulo10(l3);
      let dv4 = modulo10(l4);
      
      return `${l1}${dv1}${l2}${dv2}${l3}${dv3}${l4}${dv4}`;
    }
    
    // Bank boleto
    const bank = clean.substring(0, 3);
    const currency = clean.substring(3, 4);
    const dv = clean.substring(4, 5);
    const factor = clean.substring(5, 9);
    const val = clean.substring(9, 19);
    const campLivre = clean.substring(19, 44);
    
    const b1 = bank + currency + campLivre.substring(0, 5);
    const dv1 = modulo10(b1);
    
    const b2 = campLivre.substring(5, 15);
    const dv2 = modulo10(b2);
    
    const b3 = campLivre.substring(15, 25);
    const dv3 = modulo10(b3);
    
    const b4 = dv;
    const b5 = factor + val;
    
    return `${b1}${dv1}${b2}${dv2}${b3}${dv3}${b4}${b5}`;
  }

  app.post("/api/public/parse-boleto", authenticateToken, async (req, res) => {
    const { fileContent, apiKey } = req.body;
    if (!fileContent) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    try {
      const buffer = Buffer.from(fileContent, 'base64');
      const extractedData: any = {
        fornecedor: null,
        valor: null,
        data_vencimento: null,
        linha_digitavel: null,
        codigo_pix: null
      };

      // 1. Try decoding QR Code and ITF (1D Barcode) locally using zxing-wasm
      try {
        const results = await readBarcodesFromImageFile(new Blob([buffer]), {
          tryHarder: true,
          formats: ['ITF', 'QRCode']
        });

        if (results && results.length > 0) {
          for (const result of results) {
            if (result.format === 'QRCode' && result.text) {
              extractedData.codigo_pix = result.text;
              
              // Parse Pix EMV tags
              try {
                let i = 0;
                const tags: Record<string, string> = {};
                const pix = result.text;
                while (i < pix.length - 4) {
                  const tag = pix.substring(i, i + 2);
                  const lenStr = pix.substring(i + 2, i + 4);
                  const len = parseInt(lenStr, 10);
                  if (isNaN(len)) break;
                  const val = pix.substring(i + 4, i + 4 + len);
                  tags[tag] = val;
                  i += 4 + len;
                }
                if (tags["59"]) {
                  extractedData.fornecedor = tags["59"];
                }
                if (tags["54"] && !extractedData.valor) {
                  extractedData.valor = parseFloat(tags["54"]);
                }
              } catch (e) {
                console.error("Error parsing Pix tags:", e);
              }
            } else if (result.format === 'ITF' && result.text) {
              const clean = result.text.replace(/\D/g, "");
              if (clean.length === 44) {
                extractedData.linha_digitavel = barcodeToLinhaDigitavel(clean);
                
                // Extract due date and value from 44-digit ITF
                try {
                  if (clean[0] === '8') {
                    const valCents = parseInt(clean.substring(4, 15), 10);
                    if (!isNaN(valCents)) {
                      extractedData.valor = valCents / 100;
                    }
                  } else {
                    const factor = parseInt(clean.substring(5, 9), 10);
                    const valCents = parseInt(clean.substring(9, 19), 10);
                    
                    if (!isNaN(valCents) && !extractedData.valor) {
                      extractedData.valor = valCents / 100;
                    }
                    
                    if (!isNaN(factor) && factor > 0 && !extractedData.data_vencimento) {
                      let baseDate = new Date(1997, 9, 7);
                      baseDate.setDate(baseDate.getDate() + factor);
                      extractedData.data_vencimento = baseDate.toISOString().split('T')[0];
                    }
                  }
                } catch (err) {
                  console.error("Error parsing ITF fields:", err);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Local ZXing barcode scan failed:", err);
      }

      // 2. Try calling Gemini API as backup to extract full data
      const geminiKey = apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && (!extractedData.fornecedor || !extractedData.valor || !extractedData.data_vencimento)) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              'Extraia as seguintes informações do boleto bancário (fornecedor/beneficiário, valor, data de vencimento formatada como AAAA-MM-DD, linha digitável, e código pix copia e cola se houver). Forneça o resultado estritamente no formato JSON: {"fornecedor": string|null, "valor": number|null, "data_vencimento": string|null, "linha_digitavel": string|null, "codigo_pix": string|null}',
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: fileContent
                }
              }
            ],
            config: {
              responseMimeType: 'application/json',
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed.fornecedor && !extractedData.fornecedor) extractedData.fornecedor = parsed.fornecedor;
            if (parsed.valor && !extractedData.valor) extractedData.valor = parsed.valor;
            if (parsed.data_vencimento && !extractedData.data_vencimento) extractedData.data_vencimento = parsed.data_vencimento;
            if (parsed.linha_digitavel && !extractedData.linha_digitavel) extractedData.linha_digitavel = parsed.linha_digitavel;
            if (parsed.codigo_pix && !extractedData.codigo_pix) extractedData.codigo_pix = parsed.codigo_pix;
          }
        } catch (geminiErr) {
          console.error("Gemini API call failed:", geminiErr);
        }
      }

      // 3. Fallback: Parse Linha Digitável if present to extract value and due date
      if (extractedData.linha_digitavel && (!extractedData.valor || !extractedData.data_vencimento)) {
        try {
          const clean = extractedData.linha_digitavel.replace(/\D/g, "");
          if (clean.length === 47) {
            const factor = parseInt(clean.substring(33, 37), 10);
            const valCents = parseInt(clean.substring(37, 47), 10);
            
            if (!extractedData.valor && !isNaN(valCents)) {
              extractedData.valor = valCents / 100;
            }
            
            if (!extractedData.data_vencimento && !isNaN(factor) && factor > 0) {
              let baseDate = new Date(1997, 9, 7);
              let days = factor;
              if (factor >= 1000 && factor < 5000) {
                days += 9000;
              }
              baseDate.setDate(baseDate.getDate() + days);
              extractedData.data_vencimento = baseDate.toISOString().split('T')[0];
            }
          }
        } catch (err) {
          console.error("Error parsing clean linha digitável:", err);
        }
      }

      res.json(extractedData);
    } catch (err: any) {
      console.error("Boleto parsing error:", err);
      res.status(500).json({ error: "Erro ao processar boleto: " + err.message });
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

  // Global Error Handler for API
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[FATAL ERROR] ${req.method} ${req.url}:`, err);
    res.status(500).json({ 
      error: err.message || "Erro interno no servidor",
      details: err.stack 
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n=================================================`);
    console.log(`🚀 ERP Kombat Moto Pecas - Sistema Pronto!`);
    console.log(`📞 Local: http://localhost:${PORT}`);
    console.log(`🌐 Rede: Disponivel em qualquer computador da oficina`);
    console.log(`   Use o seu IP seguido de :${PORT}`);
    console.log(`=================================================\n`);
  });
}

startServer().catch(err => {
  console.error("ERRO CRÍTICO AO INICIAR O SERVIDOR:", err);
  process.exit(1);
});

// Force redeploy - 2024-05-04
