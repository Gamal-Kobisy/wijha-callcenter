import { Router } from "express";
import { SessionController } from "../controllers/session.controller.js";

export const sessionsRouter = Router();
const sessionController = new SessionController();
sessionController.registerRoutes(sessionsRouter);