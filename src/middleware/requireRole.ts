import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errorHandler";

type Role = "Admin" | "Editor" | "Viewer";

/**
 * Middleware để kiểm tra role của user
 * Roles có hierarchy: Admin > Editor > Viewer
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const userRole = req.user.role;

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          403
        )
      );
    }

    next();
  };
}

