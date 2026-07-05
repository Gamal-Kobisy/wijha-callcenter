import type { Request, Response, Router } from "express";
import type { ListSessionsQuery, SaveSessionRequest, UserSession } from "../types/index.js";
import { createSession, getActiveSession, mockSessions } from "../routes/mock-data.js";
import { requireAuth } from "../middleware/auth.js";

export interface SessionControllerI {
    registerRoutes(router: Router): void;
    list(req: Request<{}, UserSession[], {}, ListSessionsQuery>, res: Response<UserSession[]>): void;
    create(req: Request<{}, void, SaveSessionRequest>, res: Response): void;
    active(req: Request, res: Response): void;
}

export class SessionController implements SessionControllerI {
    registerRoutes(router: Router): void {
        router.use(requireAuth);
        router.get("/", this.list);
        router.post("/", this.create);
        router.post("/active", this.active);
    }

    list = (req: Request<{}, UserSession[], {}, ListSessionsQuery>, res: Response<UserSession[]>): void => {
        void req.query;
        res.json(mockSessions);
    };

    create = (req: Request<{}, void, SaveSessionRequest>, res: Response): void => {
        createSession({
            agent_id: req.user?.id ?? 1,
            start_time: req.body.start_time,
            ...(req.body.duration !== undefined ? { duration: req.body.duration } : { duration: null }),
            is_active: true,
        });

        res.sendStatus(201);
    };

    active = (_req: Request, res: Response): void => {
        const activeSession = getActiveSession();

        if (!activeSession) {
            res.sendStatus(204);
            return;
        }

        res.sendStatus(200);
    };
}