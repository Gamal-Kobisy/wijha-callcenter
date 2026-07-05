import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  next();
}

export function requireRole(...roles: Array<"admin" | "agent">) {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}