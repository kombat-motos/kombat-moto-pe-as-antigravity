import { Request, Response } from "express";
import { AIService } from "./ai.service.js";
import Database from "better-sqlite3";

export class AIController {
  private aiService: AIService;

  constructor(db: Database.Database) {
    this.aiService = new AIService(db);
  }

  public async chat(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Não autorizado" });
        return;
      }

      const { message, conversationId, context } = req.body;

      if (!message) {
        res.status(400).json({ success: false, message: "A mensagem é obrigatória" });
        return;
      }

      const result = await this.aiService.processChat(
        req.user.id,
        message,
        conversationId,
        context
      );

      res.json(result);
    } catch (error: any) {
      console.error("[AI Chat Error]:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ocorreu um erro ao processar a resposta da IA." 
      });
    }
  }
}
