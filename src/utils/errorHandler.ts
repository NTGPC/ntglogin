import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientInitializationError' || err.message?.includes('Prisma')) {
    console.error('Prisma Error:', err);
    const prismaErr = err as any;
    let errorMessage = 'Database error';
    
    // Provide more specific error messages
    if (prismaErr.code === 'P2002') {
      errorMessage = 'Unique constraint violation';
    } else if (prismaErr.code === 'P2025') {
      errorMessage = 'Record not found';
    } else if (prismaErr.code === 'P1001' || prismaErr.code === 'P1017') {
      errorMessage = 'Cannot connect to database. Please check DATABASE_URL and ensure database is running';
    } else if (prismaErr.code === 'P1000') {
      errorMessage = 'Database authentication failed. Please check DATABASE_URL credentials';
    } else if (prismaErr.message?.includes('does not exist') || prismaErr.message?.includes('relation') || prismaErr.message?.includes('table')) {
      errorMessage = 'Database tables not found. Please run: npm run prisma:migrate';
    }
    
    return res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : errorMessage,
      code: process.env.NODE_ENV === 'development' ? prismaErr.code : undefined,
    });
  }

  // Default error
  console.error('Error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

