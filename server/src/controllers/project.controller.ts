import type { Request, Response, Router } from "express";
import type {
    ApiError,
    CreateProjectRequest,
    Project,
    ProjectIdParam,
    UpdateProjectRequest,
} from "../types/index.js";
import { createProject, deleteProject, getProjectById, mockProjects, updateProject } from "../routes/mock-data.js";
import { requireAuth } from "../middleware/auth.js";

export interface ProjectControllerI {
    registerRoutes(router: Router): void;
    list(req: Request, res: Response<Project[]>): void;
    create(req: Request<{}, Project, CreateProjectRequest>, res: Response<Project>): void;
    getById(req: Request<ProjectIdParam>, res: Response<Project | ApiError>): void;
    patch(req: Request<ProjectIdParam, Project, UpdateProjectRequest>, res: Response<Project | ApiError>): void;
    remove(req: Request<ProjectIdParam>, res: Response): void;
}

export class ProjectController implements ProjectControllerI {
    registerRoutes(router: Router): void {
        router.use(requireAuth);
        router.get("/", this.list);
        router.post("/", this.create);
        router.get("/:projectId", this.getById);
        router.patch("/:projectId", this.patch);
        router.delete("/:projectId", this.remove);
    }

    list = (_req: Request, res: Response<Project[]>): void => {
        res.json(mockProjects);
    };

    create = (req: Request<{}, Project, CreateProjectRequest>, res: Response<Project>): void => {
        const project = createProject(req.body.name, req.body.description);
        res.status(201).json(project);
    };

    getById = (req: Request<ProjectIdParam>, res: Response<Project | ApiError>): void => {
        const project = getProjectById(Number(req.params.projectId));

        if (!project) {
            res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "No project with that ID exists" });
            return;
        }

        res.json(project);
    };

    patch = (
        req: Request<ProjectIdParam, Project, UpdateProjectRequest>,
        res: Response<Project | ApiError>
    ): void => {
        const project = updateProject(Number(req.params.projectId), req.body);

        if (!project) {
            res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "No project with that ID exists" });
            return;
        }

        res.json(project);
    };

    remove = (req: Request<ProjectIdParam>, res: Response): void => {
        const deleted = deleteProject(Number(req.params.projectId));

        if (!deleted) {
            res.status(404).json({ code: "PROJECT_NOT_FOUND", message: "No project with that ID exists" });
            return;
        }

        res.sendStatus(204);
    };
}