import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";

export const usersRouter = Router();
const userController = new UserController();
userController.registerRoutes(usersRouter);