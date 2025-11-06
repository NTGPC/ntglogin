import { Request, Response, NextFunction } from "express";
import { verifyToken, AccessClaims } from "../security/jwt";
import { AppError } from "../utils/errorHandler";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: "Admin" | "Editor" | "Viewer";
      };
    }
  }
}

/**
 * Middleware để verify JWT token và gắn user vào request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = await verifyToken<AccessClaims>(token);

    if (!payload.sub) {
      throw new AppError("Invalid token: missing subject", 401);
    }

    req.user = {
      sub: payload.sub,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(new AppError("Unauthorized", 401));
  }
}

