import type { Request, Response, Router } from "express";
import type {
    ApiError,
    CreateOwnerRequest,
    ListOwnersQuery,
    Owner,
    OwnerIdParam,
    PaginatedOwners,
    UpdateOwnerRequest,
} from "../types/index.js";
import { createOwner, getOwnerById, mockOwners, updateOwner } from "../routes/mock-data.js";
import { requireAuth } from "../middleware/auth.js";

export interface OwnerControllerI {
    registerRoutes(router: Router): void;
    listOwners(req: Request<{}, PaginatedOwners, {}, ListOwnersQuery>, res: Response<PaginatedOwners>): void;
    create(req: Request<{}, Owner, CreateOwnerRequest>, res: Response<Owner>): void;
    getById(req: Request<OwnerIdParam>, res: Response<Owner | ApiError>): void;
    patch(req: Request<OwnerIdParam, Owner, UpdateOwnerRequest>, res: Response<Owner | ApiError>): void;
}

export class OwnerController implements OwnerControllerI {
    registerRoutes(router: Router): void {
        router.use(requireAuth);
        router.get("/", this.listOwners);
        router.post("/", this.create);
        router.get("/:ownerId", this.getById);
        router.patch("/:ownerId", this.patch);
    }

    listOwners = (
        req: Request<{}, PaginatedOwners, {}, ListOwnersQuery>,
        res: Response<PaginatedOwners>
    ): void => {
        const status = req.query.status;
        const page = Number(req.query.page ?? 1);
        const limit = Math.min(Number(req.query.limit ?? 20), 100);

        const filteredOwners = mockOwners.filter(owner => (status ? owner.status === status : true));
        const start = (page - 1) * limit;

        res.json({
            data: filteredOwners.slice(start, start + limit),
            meta: {
                total: filteredOwners.length,
                page,
                limit,
            },
        });
    };

    create = (req: Request<{}, Owner, CreateOwnerRequest>, res: Response<Owner>): void => {
        const owner = createOwner({
            name: req.body.name,
            status: req.body.status ?? "active",
            attempt_count: 0,
            last_dialed_at: null,
            next_dial_at: null,
            numbers: req.body.numbers,
            ...(req.body.info !== undefined ? { info: req.body.info } : {}),
        });

        res.status(201).json(owner);
    };

    getById = (req: Request<OwnerIdParam>, res: Response<Owner | ApiError>): void => {
        const owner = getOwnerById(Number(req.params.ownerId));

        if (!owner) {
            res.status(404).json({ code: "OWNER_NOT_FOUND", message: "No owner with that ID exists" });
            return;
        }

        res.json(owner);
    };

    patch = (
        req: Request<OwnerIdParam, Owner, UpdateOwnerRequest>,
        res: Response<Owner | ApiError>
    ): void => {
        const owner = updateOwner(Number(req.params.ownerId), req.body);

        if (!owner) {
            res.status(404).json({ code: "OWNER_NOT_FOUND", message: "No owner with that ID exists" });
            return;
        }

        res.json(owner);
    };
}