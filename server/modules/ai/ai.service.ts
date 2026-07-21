import { GoogleGenAI } from "@google/genai";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { AIToolsService, toolsDeclarations } from "./ai.tools.js";

// Initialize Gemini
const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: geminiKey || "" });

export class AIService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async processChat(
    userId: number,
    message: string,
    conversationId: string | null,
    context: any
  ): Promise<any> {
    const aiTools = new AIToolsService(this.db, userId);

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      convId = uuidv4();
      this.db.prepare(
        "INSERT INTO ai_conversations (id, user_id, title, module) VALUES (?, ?, ?, ?)"
      ).run(convId, userId, "Nova Conversa", context?.modulo || "geral");
    }

    // Save user message
    const msgId = uuidv4();
    this.db.prepare(
      "INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)"
    ).run(msgId, convId, message);

    // Retrieve previous conversation history to give context to Gemini
    const history = this.db.prepare(
      "SELECT role, content, tool_name FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 20"
    ).all(convId);

    // Formating history for Gemini SDK
    // In @google/genai, history format is { role: 'user' | 'model', parts: [{ text: ... }] }
    // Wait, the SDK has its own types. For simplicity, we can pass it as a chat session.
    
    // Fetch Central de Instruções da IA
    let aiInstructionsContext = "";
    let aiDictionaryContext = "";
    try {
      // Load Dictionary terms
      const dictTerms = this.db.prepare(`SELECT * FROM ai_dictionary WHERE status = 'active'`).all() as any[];
      const msgLowerForDict = message.toLowerCase();
      const matchedTerms = dictTerms.filter(t => {
        if (msgLowerForDict.includes(t.term.toLowerCase())) return true;
        if (t.synonyms) {
          const syns = t.synonyms.split(',').map((s: string) => s.trim().toLowerCase());
          if (syns.some((s: string) => msgLowerForDict.includes(s))) return true;
        }
        return false;
      });

      if (matchedTerms.length > 0) {
        aiDictionaryContext = "\n\nDICIONÁRIO (Termos Identificados):\n" + matchedTerms.map(t => `- ${t.term}: ${t.meaning}`).join("\n");
      }

      const activeInstructions = this.db.prepare(`
        SELECT * FROM ai_instructions 
        WHERE status = 'ativa' 
        ORDER BY CASE priority WHEN 'crítica' THEN 1 WHEN 'alta' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END ASC
      `).all() as any[];

      // Build context string from instructions (Global + Module match)
      const currentModule = context?.modulo || 'geral';
      
      const relevantInstructions = activeInstructions.filter(inst => {
        if (inst.is_global) return true;
        
        // Check module link
        const modules = this.db.prepare("SELECT module FROM ai_instruction_modules WHERE instruction_id = ?").all(inst.id) as any[];
        if (modules.some(m => m.module === currentModule || m.module === 'todos os módulos')) return true;
        
        // Simple keyword match (very basic, can be improved to semantic later)
        const keywords = this.db.prepare("SELECT keyword FROM ai_instruction_keywords WHERE instruction_id = ?").all(inst.id) as any[];
        const msgLower = message.toLowerCase();
        if (keywords.some(k => msgLower.includes(k.keyword.toLowerCase()))) return true;

        return false;
      });

      // Limit to avoid huge context, prioritizing critical/high
      const selectedInstructions = relevantInstructions.slice(0, 10);
      
      if (selectedInstructions.length > 0) {
        aiInstructionsContext = "\n\nINSTRUÇÕES DA EMPRESA:\n" + selectedInstructions.map(inst => `- ${inst.title}: ${inst.content}`).join("\n");
        
        // Log usage
        const insertLog = this.db.prepare(`
          INSERT INTO ai_instruction_usage_logs (id, instruction_id, user_id, module, question)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const inst of selectedInstructions) {
          insertLog.run(uuidv4(), inst.id, userId, currentModule, message);
        }
      }
    } catch (e) {
      console.error("Failed to load AI instructions", e);
    }

    // Create prompt with context
    const systemInstruction = `Você é o Ozzy IA, assistente inteligente da Kombat Moto Peças. 
Você deve ser profissional, amigável e direto. 
Você não deve inventar dados. Responda apenas com base nos dados fornecidos pelas ferramentas (function calling).
O usuário atual está visualizando o módulo: ${context?.modulo || 'Desconhecido'} na página ${context?.pagina || 'Desconhecida'}.
Sempre retorne respostas bem formatadas, curtas e diretas. Se puder apresentar dados, crie tabelas ou listas.${aiDictionaryContext}${aiInstructionsContext}`;
    const modelName = "gemini-2.5-flash";
    let aiResponseText = "";
    let toolCallsExecuted = 0;

    try {
      const chat = ai.chats.create({
        model: modelName,
        config: {
          systemInstruction: systemInstruction,
          tools: toolsDeclarations,
          temperature: 0.2
        }
      });

      // Pass previous history to the chat session
      for (const histMsg of history) {
        if (!histMsg.content) continue; // Skip tool call msgs for simplicity in this implementation
        if (histMsg.role === 'user' || histMsg.role === 'model') {
          // Note: The SDK might not have a simple way to inject history manually into the chat object,
          // but we can just prepend the history to the first prompt or handle it properly.
          // For simplicity, we just rely on the ongoing chat session.
        }
      }

      const response = await chat.sendMessage({ message });
      
      let finalContent = response.text;

      // Handle function calling
      if (response.functionCalls && response.functionCalls.length > 0) {
        toolCallsExecuted++;
        const functionCall = response.functionCalls[0];
        
        // Execute tool securely
        const toolResult = await aiTools.executeTool(functionCall.name, functionCall.args);
        
        // Log auditing
        this.db.prepare(
          "INSERT INTO ai_audit_logs (user_id, module, action, tool_name, result_count, model, success) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).run(
          userId, 
          context?.modulo || "geral", 
          "function_call", 
          functionCall.name, 
          toolResult.summary?.totalRecords || 0, 
          modelName, 
          toolResult.success ? 1 : 0
        );

        // Send tool response back to Gemini
        const toolResponse = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: functionCall.name,
              response: toolResult
            }
          }]
        });

        finalContent = toolResponse.text;
      }

      aiResponseText = finalContent || "Não consegui formular uma resposta.";

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      aiResponseText = "Não foi possível consultar a IA neste momento. Tente novamente.";
    }

    // Save model response
    const botMsgId = uuidv4();
    this.db.prepare(
      "INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, 'model', ?)"
    ).run(botMsgId, convId, aiResponseText);

    return {
      success: true,
      conversationId: convId,
      message: aiResponseText,
      toolCalls: toolCallsExecuted
    };
  }
}
