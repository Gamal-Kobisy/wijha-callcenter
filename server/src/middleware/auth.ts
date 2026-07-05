import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  next();
}

export function requireRole(...roles: Array<"admin" | "user">) {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}