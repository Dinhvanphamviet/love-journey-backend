import { Router } from "express";
import { createMemory, getJourneyMemories, upsertDiary } from "../controllers/memoryController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const memoryRoutes = Router();

memoryRoutes.use(requireAuth);
memoryRoutes.post("/memory", asyncHandler(createMemory));
memoryRoutes.get("/journey/:id/memories", asyncHandler(getJourneyMemories));
memoryRoutes.post("/diary", asyncHandler(upsertDiary));
