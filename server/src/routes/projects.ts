import { Router } from "express";
import { ProjectController } from "../controllers/project.controller.js";

export const projectsRouter = Router();
const projectController = new ProjectController();
projectController.registerRoutes(projectsRouter);