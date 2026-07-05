import type { Request, Response, Router } from "express";
import type {
    ApiError,
    CallDetailRecord,
    CallIdParam,
    GetNextOwnerQuery,
    ListCallsQuery,
    NotifyCallingRequest,
    Owner,
    PaginatedCalls,
    SubmitCallRequest,
} from "../types/index.js";
import { createCall, getCallById, getNextOwner, mockCalls } from "../routes/mock-data.js";
import { requireAuth } from "../middleware/auth.js";

export interface CallControllerI {
    registerRoutes(router: Router): void;
    listCalls(req: Request<{}, PaginatedCalls, {}, ListCallsQuery>, res: Response<PaginatedCalls>): void;
    submitCall(req: Request<{}, CallDetailRecord, SubmitCallRequest>, res: Response<CallDetailRecord>): void;
    getNext(
        req: Request<{}, Owner, {}, GetNextOwnerQuery>,
        res: Response<Owner | void>
    ): void;
    notifyCalling(req: Request<{}, void, NotifyCallingRequest>, res: Response): void;
    getById(req: Request<CallIdParam>, res: Response<CallDetailRecord | ApiError>): void;
}

export class CallController implements CallControllerI {
    registerRoutes(router: Router): void {
        router.use(requireAuth);
        router.get("/", this.listCalls);
        router.post("/", this.submitCall);
        router.get("/next", this.getNext);
        router.post("/calling", this.notifyCalling);
        router.get("/:callId", this.getById);
    }

    listCalls = (
        req: Request<{}, PaginatedCalls, {}, ListCallsQuery>,
        res: Response<PaginatedCalls>
    ): void => {
        const ownerId = req.query.owner_id ? Number(req.query.owner_id) : undefined;
        const agentId = req.query.agent_id ? Number(req.query.agent_id) : undefined;
        const status = req.query.status;
        const limit = Number(req.query.limit ?? 50);

        const filteredCalls = mockCalls.filter(call => {
            const matchesOwner = ownerId !== undefined ? call.owner_id === ownerId : true;
            const matchesAgent = agentId !== undefined ? call.agent_id === agentId : true;
            const matchesStatus = status ? call.status === status : true;
            return matchesOwner && matchesAgent && matchesStatus;
        });

        res.json({
            data: filteredCalls.slice(0, limit),
            meta: {
                total: filteredCalls.length,
                page: 1,
                limit,
            },
        });
    };

    submitCall = (
        req: Request<{}, CallDetailRecord, SubmitCallRequest>,
        res: Response<CallDetailRecord>
    ): void => {
        const call = createCall({
            owner_id: req.body.owner_id,
            agent_id: req.user?.id ?? 1,
            status: req.body.status,
            time: req.body.time,
            ...(req.body.duration !== undefined ? { duration: req.body.duration } : { duration: null }),
            ...(req.body.agent_notes !== undefined
                ? { agent_notes: req.body.agent_notes }
                : { agent_notes: null }),
        });

        res.status(201).json(call);
    };

    getNext = (req: Request<{}, Owner, {}, GetNextOwnerQuery>, res: Response<Owner | void>): void => {
        const owner = getNextOwner(Number(req.query.project_id));

        if (!owner) {
            res.sendStatus(204);
            return;
        }

        res.json(owner);
    };

    notifyCalling = (req: Request<{}, void, NotifyCallingRequest>, res: Response): void => {
        void req.body;
        res.sendStatus(200);
    };

    getById = (req: Request<CallIdParam>, res: Response<CallDetailRecord | ApiError>): void => {
        const call = getCallById(Number(req.params.callId));

        if (!call) {
            res.status(404).json({ code: "CALL_NOT_FOUND", message: "No call with that ID exists" });
            return;
        }

        res.json(call);
    };
}