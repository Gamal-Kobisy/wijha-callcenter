import type { Request, Response, Router } from "express";
import type {
    ApiError,
    CreateUserRequest,
    GetUserStatsQuery,
    ListUsersQuery,
    UpdateUserRequest,
    User,
    UserIdParam,
    UserStats,
} from "../types/index.js";
import { createUser, deleteUser, getUserById, getUserStats, mockUsers, updateUser } from "../routes/mock-data.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export interface UserControllerI {
    registerRoutes(router: Router): void;
    list(req: Request<{}, User[], {}, ListUsersQuery>, res: Response<User[]>): void;
    create(req: Request<{}, User, CreateUserRequest>, res: Response<User>): void;
    getById(req: Request<UserIdParam>, res: Response<User | ApiError>): void;
    patch(req: Request<UserIdParam, User, UpdateUserRequest>, res: Response<User | ApiError>): void;
    remove(req: Request<UserIdParam>, res: Response): void;
    stats(req: Request<UserIdParam, UserStats, {}, GetUserStatsQuery>, res: Response<UserStats | ApiError>): void;
}

export class UserController implements UserControllerI {
    registerRoutes(router: Router): void {
        router.use(requireAuth);
        router.get("/", requireRole("admin"), this.list);
        router.post("/", requireRole("admin"), this.create);
        router.get("/:userId", this.getById);
        router.patch("/:userId", requireRole("admin"), this.patch);
        router.delete("/:userId", requireRole("admin"), this.remove);
        router.get("/:userId/stats", this.stats);
    }

    list = (req: Request<{}, User[], {}, ListUsersQuery>, res: Response<User[]>): void => {
        const role = req.query.role;
        const users = role ? mockUsers.filter(user => user.role === role) : mockUsers;
        res.json(users);
    };

    create = (req: Request<{}, User, CreateUserRequest>, res: Response<User>): void => {
        const user = createUser({
            email: req.body.email,
            name: req.body.name ?? null,
            phone_number: req.body.phone_number ?? null,
            role: req.body.role,
        });

        res.status(201).json(user);
    };

    getById = (req: Request<UserIdParam>, res: Response<User | ApiError>): void => {
        const user = getUserById(Number(req.params.userId));

        if (!user) {
            res.status(404).json({ code: "USER_NOT_FOUND", message: "No user with that ID exists" });
            return;
        }

        res.json(user);
    };

    patch = (req: Request<UserIdParam, User, UpdateUserRequest>, res: Response<User | ApiError>): void => {
        const user = updateUser(Number(req.params.userId), req.body);

        if (!user) {
            res.status(404).json({ code: "USER_NOT_FOUND", message: "No user with that ID exists" });
            return;
        }

        res.json(user);
    };

    remove = (req: Request<UserIdParam>, res: Response): void => {
        const deleted = deleteUser(Number(req.params.userId));

        if (!deleted) {
            res.status(404).json({ code: "USER_NOT_FOUND", message: "No user with that ID exists" });
            return;
        }

        res.sendStatus(204);
    };

    stats = (
        req: Request<UserIdParam, UserStats, {}, GetUserStatsQuery>,
        res: Response<UserStats | ApiError>
    ): void => {
        const stats = getUserStats(Number(req.params.userId));

        if (!stats) {
            res.status(404).json({ code: "USER_NOT_FOUND", message: "No user with that ID exists" });
            return;
        }

        res.json(stats);
    };
}