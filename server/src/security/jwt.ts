import type { Jwt, JwtPayload, Secret } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { AuthenticatedUser, User, UserRole } from "../types/index.js";

let SECRET: Secret = process.env.JWT_SECRET || "default";
const options = {
  expiresIn: "1h",
  algorithm: "HS256"
};

export function verifyJwt(token: string | undefined | null): AuthenticatedUser | null {
    if (!token) {
        console.error("No token provided for verification");
        return null;
    }
    try {
        const decoded = jwt.verify(token, SECRET) as AuthenticatedUser;
        return decoded;
    } catch (err) {
        console.error("JWT verification failed:", err);
        return null;
    }
}

export function signJwt(payload: object): string {
    return jwt.sign(payload, SECRET, { expiresIn: "1h", algorithm: "HS256" });
}