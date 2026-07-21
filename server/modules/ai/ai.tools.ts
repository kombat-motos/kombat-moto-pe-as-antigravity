import Database from "better-sqlite3";
import { Tool } from "@google/genai";

// Mapeamento de tipos para o Gemini
export const toolsDeclarations: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "consultarClientes",
        description: "Consulta a lista de clientes cadastrados no sistema",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "INTEGER", description: "Número máximo de clientes a retornar (padrão: 50)" },
            searchTerm: { type: "STRING", description: "Termo de busca pelo nome ou CPF/CNPJ" }
          }
        }
      },
      {
        name: "consultarProdutos",
        description: "Consulta produtos e estoque no sistema",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "INTEGER", description: "Limite de resultados (padrão 50)" },
            searchTerm: { type: "STRING", description: "Busca por nome, SKU ou marca" },
            somenteEstoqueBaixo: { type: "BOOLEAN", description: "Se true, traz apenas produtos com estoque <= 5" }
          }
        }
      },
      {
        name: "consultarContasAPagar",
        description: "Consulta contas a pagar",
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Pendente, Pago ou Atrasado" },
            limit: { type: "INTEGER" }
          }
        }
      },
      {
        name: "consultarContasAReceber",
        description: "Consulta notas promissórias (contas a receber) de clientes (tabela credit)",
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Aberto, Pago ou Atrasado" },
            limit: { type: "INTEGER" }
          }
        }
      },
      {
        name: "consultarOrdensServico",
        description: "Consulta serviços e vendas na oficina/balcão",
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Aberto, Em Andamento, Pronto, Concluído" },
            limit: { type: "INTEGER" }
          }
        }
      }
    ]
  }
];

export class AIToolsService {
  constructor(private db: Database.Database, private userId: number) {}

  async executeTool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case "consultarClientes":
          return this.consultarClientes(args);
        case "consultarProdutos":
          return this.consultarProdutos(args);
        case "consultarContasAPagar":
          return this.consultarContasAPagar(args);
        case "consultarContasAReceber":
          return this.consultarContasAReceber(args);
        case "consultarOrdensServico":
          return this.consultarOrdensServico(args);
        default:
          throw new Error(`Tool ${name} não implementada.`);
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private consultarClientes(args: any) {
    const limit = args.limit || 50;
    let query = "SELECT id, name, whatsapp, address, credit_limit FROM customers WHERE user_id = ?";
    const params: any[] = [this.userId];
    
    if (args.searchTerm) {
      query += " AND (name LIKE ? OR cpf LIKE ?)";
      params.push(`%${args.searchTerm}%`, `%${args.searchTerm}%`);
    }
    
    query += " LIMIT ?";
    params.push(limit);
    
    const data = this.db.prepare(query).all(...params);
    return { success: true, data, summary: { totalRecords: data.length } };
  }

  private consultarProdutos(args: any) {
    const limit = args.limit || 50;
    let query = "SELECT id, description, sku, sale_price, stock, category, brand FROM products WHERE user_id = ?";
    const params: any[] = [this.userId];
    
    if (args.searchTerm) {
      query += " AND (description LIKE ? OR sku LIKE ? OR brand LIKE ?)";
      params.push(`%${args.searchTerm}%`, `%${args.searchTerm}%`, `%${args.searchTerm}%`);
    }

    if (args.somenteEstoqueBaixo) {
      query += " AND stock <= 5";
    }
    
    query += " LIMIT ?";
    params.push(limit);
    
    const data = this.db.prepare(query).all(...params);
    return { success: true, data, summary: { totalRecords: data.length } };
  }

  private consultarContasAPagar(args: any) {
    const limit = args.limit || 50;
    let query = "SELECT id, fornecedor, valor, due_date, status, paid_date FROM accounts_payable WHERE user_id = ?";
    const params: any[] = [this.userId];
    
    if (args.status) {
      if (args.status.toLowerCase() === 'atrasado') {
        query += " AND status = 'Pendente' AND date(due_date) < date('now')";
      } else {
        query += " AND status = ?";
        params.push(args.status);
      }
    }
    
    query += " ORDER BY due_date ASC LIMIT ?";
    params.push(limit);
    
    const data = this.db.prepare(query).all(...params);
    const totalValue = data.reduce((acc: number, curr: any) => acc + curr.valor, 0);
    return { success: true, data, summary: { totalRecords: data.length, totalValue } };
  }

  private consultarContasAReceber(args: any) {
    const limit = args.limit || 50;
    let query = `
      SELECT c.id, c.original_value as valor, c.due_date, c.status, cust.name as cliente
      FROM credit c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE c.user_id = ?
    `;
    const params: any[] = [this.userId];
    
    if (args.status) {
      if (args.status.toLowerCase() === 'atrasado') {
        query += " AND c.status = 'Aberto' AND date(c.due_date) < date('now')";
      } else {
        query += " AND c.status = ?";
        params.push(args.status);
      }
    }
    
    query += " ORDER BY c.due_date ASC LIMIT ?";
    params.push(limit);
    
    const data = this.db.prepare(query).all(...params);
    const totalValue = data.reduce((acc: number, curr: any) => acc + curr.valor, 0);
    return { success: true, data, summary: { totalRecords: data.length, totalValue } };
  }

  private consultarOrdensServico(args: any) {
    const limit = args.limit || 50;
    let query = "SELECT id, customer_name, total, payment_method, status, date, type FROM sales WHERE user_id = ?";
    const params: any[] = [this.userId];
    
    if (args.status) {
      query += " AND status = ?";
      params.push(args.status);
    }
    
    query += " ORDER BY date DESC LIMIT ?";
    params.push(limit);
    
    const data = this.db.prepare(query).all(...params);
    const totalValue = data.reduce((acc: number, curr: any) => acc + curr.total, 0);
    return { success: true, data, summary: { totalRecords: data.length, totalValue } };
  }
}
