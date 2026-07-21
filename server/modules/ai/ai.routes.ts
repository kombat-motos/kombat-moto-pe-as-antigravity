import { Router } from "express";
import { AIController } from "./ai.controller.js";
import Database from "better-sqlite3";

export function createAIRouter(db: Database.Database): Router {
  const router = Router();
  const aiController = new AIController(db);

  router.post("/chat", aiController.chat.bind(aiController));

  return router;
}
