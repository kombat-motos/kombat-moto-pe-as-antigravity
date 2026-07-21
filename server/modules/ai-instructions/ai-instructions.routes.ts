import { Router } from "express";
import Database from "better-sqlite3";
import { AIInstructionsController } from "./ai-instructions.controller.js";

export function createAIInstructionsRouter(db: Database.Database): Router {
  const router = Router();
  const controller = new AIInstructionsController(db);

  // Instructions
  router.get("/", controller.listInstructions.bind(controller));
  router.get("/:id", controller.getInstruction.bind(controller));
  router.post("/", controller.createInstruction.bind(controller));
  router.put("/:id", controller.updateInstruction.bind(controller));
  router.delete("/:id", controller.deleteInstruction.bind(controller));

  // Status Modifiers
  router.post("/:id/publish", controller.publishInstruction.bind(controller));
  router.post("/:id/activate", controller.activateInstruction.bind(controller));
  router.post("/:id/deactivate", controller.deactivateInstruction.bind(controller));

  // Simulator
  router.post("/:id/test", controller.testInstruction.bind(controller));

  // Dictionary
  router.get("/dictionary", controller.listDictionary.bind(controller));
  router.post("/dictionary", controller.createDictionaryTerm.bind(controller));
  router.put("/dictionary/:id", controller.updateDictionaryTerm.bind(controller));
  router.delete("/dictionary/:id", controller.deleteDictionaryTerm.bind(controller));

  return router;
}
