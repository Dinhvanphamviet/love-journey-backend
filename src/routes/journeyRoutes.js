import { Router } from "express";
import { createJourney, getCurrentJourney, getJourney, joinJourney } from "../controllers/journeyController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const journeyRoutes = Router();

journeyRoutes.use(requireAuth);
journeyRoutes.post("/", asyncHandler(createJourney));
journeyRoutes.post("/join", asyncHandler(joinJourney));
journeyRoutes.get("/current", asyncHandler(getCurrentJourney));
journeyRoutes.get("/:id", asyncHandler(getJourney));
