import type { Request, Response, Router } from "express";
import type { AuthenticatedUser, LoginRequest, LoginResponse, User, UserRole } from "../types/index.js";
import { signJwt, verifyJwt } from "../security/jwt.js";
import { requireAuth } from "../middleware/auth.js";

export interface AuthControllerI {
	registerRoutes(router: Router): void;
	login(req: Request<{}, LoginResponse, LoginRequest>, res: Response<LoginResponse | { message: string }>): void;
	logout(req: Request, res: Response): void;
	me(req: Request, res: Response<AuthenticatedUser>): void;
}

export class AuthController implements AuthControllerI {
	private users: User[] = [
		{
			id: 1,
			email: "agent",
			name: "Agent Smith",
			phone_number: "123-456-7890",
			role: "agent" as UserRole,
		},
		{
			id: 2,
			email: "admin",
			name: "Admin User",
			phone_number: "098-765-4321",
			role: "admin" as UserRole,
		},
	];

	registerRoutes(router: Router): void {
		router.post("/login", this.login);
		router.post("/logout", requireAuth, this.logout);
		router.get("/me", requireAuth, this.me);
	}

	login = (
		req: Request<{}, LoginResponse, LoginRequest>,
		res: Response<LoginResponse | { message: string }>
	): void => {
		const user = this.users.find(existingUser => existingUser.email === req.body.email);

		if (!user) {
			res.status(401).json({ message: "Invalid email or password" });
			return;
		}

		const token = signJwt(user);
		res.json({ token, user });
	};

	logout = (_req: Request, res: Response): void => {
		res.json({ message: "Logged out successfully" });
	};

	me = (req: Request, res: Response<AuthenticatedUser>): void => {
		res.json(verifyJwt(req.headers.authorization || "") as AuthenticatedUser);
	};
}
