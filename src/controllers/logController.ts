import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/logService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { level } = req.query;
  
  const logs = await logService.getAllLogs(level as string | undefined);

  res.json({
    success: true,
    data: logs,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { level, message, meta } = req.body;

  if (!level || !message) {
    throw new AppError('Level and message are required', 400);
  }

  const log = await logService.createLog({
    level,
    message,
    meta,
  });

  res.status(201).json({
    success: true,
    message: 'Log created successfully',
    data: log,
  });
});

