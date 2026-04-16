import { Request, Response, NextFunction } from "express";

export interface SessionUser {
  id: number;
  role: string;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      sessionUser?: SessionUser;
    }
  }
}

const sessions = new Map<string, SessionUser>();

export function createSession(user: SessionUser): string {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  sessions.set(token, user);
  return token;
}

export function getSession(token: string): SessionUser | undefined {
  return sessions.get(token);
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function sessionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const user = getSession(token);
    if (user) {
      req.sessionUser = user;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.sessionUser.role !== "ADMIN") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  next();
}
