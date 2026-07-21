import { Request, Response } from "express";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export class AIInstructionsController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // --- Instructions CRUD ---

  async listInstructions(req: Request, res: Response) {
    try {
      const instructions = this.db.prepare(`
        SELECT * FROM ai_instructions ORDER BY created_at DESC
      `).all();
      
      // Fetch modules and keywords for each
      const result = instructions.map((inst: any) => {
        const modules = this.db.prepare("SELECT module, route FROM ai_instruction_modules WHERE instruction_id = ?").all(inst.id);
        const keywords = this.db.prepare("SELECT keyword FROM ai_instruction_keywords WHERE instruction_id = ?").all(inst.id);
        return {
          ...inst,
          modules,
          keywords: keywords.map((k: any) => k.keyword)
        };
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInstruction(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const inst = this.db.prepare("SELECT * FROM ai_instructions WHERE id = ?").get(id);
      if (!inst) return res.status(404).json({ error: "Instruction not found" });

      const modules = this.db.prepare("SELECT module, route FROM ai_instruction_modules WHERE instruction_id = ?").all(id);
      const keywords = this.db.prepare("SELECT keyword FROM ai_instruction_keywords WHERE instruction_id = ?").all(id);
      const versions = this.db.prepare("SELECT * FROM ai_instruction_versions WHERE instruction_id = ? ORDER BY version_number DESC").all(id);

      res.json({
        ...inst,
        modules,
        keywords: keywords.map((k: any) => k.keyword),
        versions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createInstruction(req: Request, res: Response) {
    try {
      const id = uuidv4();
      const {
        title, description, content, category, instruction_type, priority,
        is_global, valid_from, valid_until, modules, keywords, status
      } = req.body;

      // Ensure created_by comes from authenticated user if available
      const created_by = (req as any).user?.id || 1;

      this.db.transaction(() => {
        this.db.prepare(`
          INSERT INTO ai_instructions (
            id, title, description, content, category, instruction_type, 
            priority, status, is_global, valid_from, valid_until, created_by, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, title, description || '', content, category || 'geral', instruction_type || 'conhecimento do sistema',
          priority || 'normal', status || 'rascunho', is_global ? 1 : 0, valid_from, valid_until, created_by, created_by
        );

        if (modules && Array.isArray(modules)) {
          const insertModule = this.db.prepare("INSERT INTO ai_instruction_modules (id, instruction_id, module, route) VALUES (?, ?, ?, ?)");
          for (const mod of modules) {
            insertModule.run(uuidv4(), id, mod.module, mod.route || null);
          }
        }

        if (keywords && Array.isArray(keywords)) {
          const insertKeyword = this.db.prepare("INSERT INTO ai_instruction_keywords (id, instruction_id, keyword) VALUES (?, ?, ?)");
          for (const kw of keywords) {
            insertKeyword.run(uuidv4(), id, kw);
          }
        }

        // Save initial version
        this.db.prepare(`
          INSERT INTO ai_instruction_versions (id, instruction_id, version_number, content, changed_by, change_reason)
          VALUES (?, ?, 1, ?, ?, 'Initial creation')
        `).run(uuidv4(), id, content, created_by);
      })();

      res.status(201).json({ id, message: "Instruction created successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateInstruction(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const {
        title, description, content, category, instruction_type, priority,
        is_global, valid_from, valid_until, modules, keywords, status, change_reason
      } = req.body;
      const updated_by = (req as any).user?.id || 1;

      const existing = this.db.prepare("SELECT * FROM ai_instructions WHERE id = ?").get(id) as any;
      if (!existing) return res.status(404).json({ error: "Instruction not found" });

      this.db.transaction(() => {
        this.db.prepare(`
          UPDATE ai_instructions SET 
            title = ?, description = ?, content = ?, category = ?, instruction_type = ?, 
            priority = ?, status = ?, is_global = ?, valid_from = ?, valid_until = ?, 
            updated_by = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          title || existing.title, description || existing.description, content || existing.content,
          category || existing.category, instruction_type || existing.instruction_type,
          priority || existing.priority, status || existing.status, is_global !== undefined ? (is_global ? 1 : 0) : existing.is_global,
          valid_from || existing.valid_from, valid_until || existing.valid_until, updated_by, id
        );

        if (modules && Array.isArray(modules)) {
          this.db.prepare("DELETE FROM ai_instruction_modules WHERE instruction_id = ?").run(id);
          const insertModule = this.db.prepare("INSERT INTO ai_instruction_modules (id, instruction_id, module, route) VALUES (?, ?, ?, ?)");
          for (const mod of modules) {
            insertModule.run(uuidv4(), id, mod.module, mod.route || null);
          }
        }

        if (keywords && Array.isArray(keywords)) {
          this.db.prepare("DELETE FROM ai_instruction_keywords WHERE instruction_id = ?").run(id);
          const insertKeyword = this.db.prepare("INSERT INTO ai_instruction_keywords (id, instruction_id, keyword) VALUES (?, ?, ?)");
          for (const kw of keywords) {
            insertKeyword.run(uuidv4(), id, kw);
          }
        }

        if (content && content !== existing.content) {
          const latestVersion = this.db.prepare("SELECT MAX(version_number) as v FROM ai_instruction_versions WHERE instruction_id = ?").get(id) as any;
          const nextV = (latestVersion?.v || 0) + 1;
          this.db.prepare(`
            INSERT INTO ai_instruction_versions (id, instruction_id, version_number, content, changed_by, change_reason)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), id, nextV, content, updated_by, change_reason || 'Updated content');
        }
      })();

      res.json({ message: "Instruction updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteInstruction(req: Request, res: Response) {
    try {
      const id = req.params.id;
      this.db.prepare("DELETE FROM ai_instructions WHERE id = ?").run(id);
      res.json({ message: "Instruction deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- Status Modifiers ---

  async publishInstruction(req: Request, res: Response) {
    try {
      const id = req.params.id;
      this.db.prepare("UPDATE ai_instructions SET status = 'ativa', published_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      res.json({ message: "Instruction published" });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async activateInstruction(req: Request, res: Response) {
    try {
      const id = req.params.id;
      this.db.prepare("UPDATE ai_instructions SET status = 'ativa' WHERE id = ?").run(id);
      res.json({ message: "Instruction activated" });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async deactivateInstruction(req: Request, res: Response) {
    try {
      const id = req.params.id;
      this.db.prepare("UPDATE ai_instructions SET status = 'inativa' WHERE id = ?").run(id);
      res.json({ message: "Instruction deactivated" });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  // --- Simulator / Test ---

  async testInstruction(req: Request, res: Response) {
    // This just simulates how it would be used
    const { id } = req.params;
    const { question, module, route } = req.body;
    try {
      const inst = this.db.prepare("SELECT * FROM ai_instructions WHERE id = ?").get(id) as any;
      if (!inst) return res.status(404).json({ error: "Instruction not found" });

      const simulatedContext = `
[CONTEXTO SIMULADO]
Módulo: ${module || 'N/A'}
Página: ${route || 'N/A'}
Instrução Forçada: ${inst.content}
`;
      res.json({ 
        message: "Simulação realizada (apenas estrutural, sem chamar API Gemini neste teste)", 
        simulatedContext,
        instruction: inst
      });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  // --- Dictionary ---

  async listDictionary(req: Request, res: Response) {
    try {
      const terms = this.db.prepare("SELECT * FROM ai_dictionary ORDER BY term ASC").all();
      res.json(terms);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async createDictionaryTerm(req: Request, res: Response) {
    try {
      const id = uuidv4();
      const { term, meaning, synonyms, category } = req.body;
      this.db.prepare(`
        INSERT INTO ai_dictionary (id, term, meaning, synonyms, category) VALUES (?, ?, ?, ?, ?)
      `).run(id, term, meaning, synonyms, category);
      res.status(201).json({ id, message: "Term created" });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async deleteDictionaryTerm(req: Request, res: Response) {
    try {
      const id = req.params.id;
      this.db.prepare("DELETE FROM ai_dictionary WHERE id = ?").run(id);
      res.json({ message: "Term deleted" });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async updateDictionaryTerm(req: Request, res: Response) {
      try {
        const id = req.params.id;
        const { term, meaning, synonyms, category, status } = req.body;
        this.db.prepare(`
          UPDATE ai_dictionary SET 
            term = COALESCE(?, term),
            meaning = COALESCE(?, meaning),
            synonyms = COALESCE(?, synonyms),
            category = COALESCE(?, category),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(term, meaning, synonyms, category, status, id);
        res.json({ message: "Term updated" });
      } catch (error: any) { res.status(500).json({ error: error.message }); }
  }
}
