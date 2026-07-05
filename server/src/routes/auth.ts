import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";

export const authRouter = Router();
const authController = new AuthController();
authController.registerRoutes(authRouter);