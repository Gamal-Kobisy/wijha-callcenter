import { Router } from "express";
import { CallController } from "../controllers/call.controller.js";

export const callsRouter = Router();
const callController = new CallController();
callController.registerRoutes(callsRouter);