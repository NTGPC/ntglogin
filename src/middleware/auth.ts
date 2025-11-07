import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { AppError } from '../utils/errorHandler';


// JWT authentication middleware
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    (req as any).user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    next(new AppError('Unauthorized', 401));
  }
};

