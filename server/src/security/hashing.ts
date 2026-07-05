import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";


export async function hashPassword(rawPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);
  return hashedPassword;
}

export async function comparePassword(rawKey: string, hashedKey: string): Promise<boolean> {
  return await bcrypt.compare(rawKey, hashedKey);
}
