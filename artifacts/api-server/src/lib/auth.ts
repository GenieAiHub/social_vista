import type { Request, Response, NextFunction, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, staffTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";
import { logger } from "./logger.js";

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for authentication.");
}

const TOKEN_TTL = "7d";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface AuthedRequest extends Request {
  staff?: AuthUser;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, username: user.username, name: user.name, role: user.role },
    SESSION_SECRET as string,
    { expiresIn: TOKEN_TTL },
  );
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, SESSION_SECRET as string) as jwt.JwtPayload;
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    // Revalidate against the DB so deactivated/deleted/demoted accounts lose
    // access immediately rather than only when their token expires.
    const [member] = await db
      .select({
        id: staffTable.id,
        username: staffTable.username,
        name: staffTable.name,
        role: staffTable.role,
        active: staffTable.active,
      })
      .from(staffTable)
      .where(eq(staffTable.id, id))
      .limit(1);

    if (!member || !member.active) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    (req as AuthedRequest).staff = {
      id: member.id,
      username: member.username,
      name: member.name,
      role: member.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireOwner: RequestHandler = (req, res, next) => {
  const staff = (req as AuthedRequest).staff;
  if (!staff || staff.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

/**
 * Ensure at least one owner account exists. On first run, seeds an owner
 * from ADMIN_USERNAME / ADMIN_PASSWORD (defaults admin / socialvista2024).
 */
export async function seedOwner(): Promise<void> {
  const [{ total }] = await db.select({ total: count() }).from(staffTable);
  if (Number(total) > 0) return;

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "socialvista2024";
  const usingDefaults = !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD;
  const passwordHash = await hashPassword(password);

  await db.insert(staffTable).values({
    name: "Owner",
    username,
    role: "owner",
    passwordHash,
  });
  if (usingDefaults) {
    logger.warn(
      { username },
      "Seeded initial owner with DEFAULT credentials. Set ADMIN_USERNAME/ADMIN_PASSWORD before first deploy, or change the password immediately after first login.",
    );
  } else {
    logger.info({ username }, "Seeded initial owner account");
  }
}

export type { Response, NextFunction };
