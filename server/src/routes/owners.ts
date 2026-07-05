import { Router } from "express";
import { OwnerController } from "../controllers/owner.controller.js";

export const ownersRouter = Router();
const ownerController = new OwnerController();
ownerController.registerRoutes(ownersRouter);