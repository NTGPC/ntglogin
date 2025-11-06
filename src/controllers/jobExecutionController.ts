import { Request, Response } from 'express';
import * as jobExecutionService from '../services/jobExecutionService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.query;
  const jobIdNum = jobId ? parseInt(jobId as string) : undefined;

  const executions = await jobExecutionService.getAllJobExecutions(jobIdNum);

  res.json({
    success: true,
    data: executions,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const execution = await jobExecutionService.getJobExecutionById(id);

  if (!execution) {
    throw new AppError('Job execution not found', 404);
  }

  res.json({
    success: true,
    data: execution,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { job_id, profile_id, session_id, status } = req.body;

  if (!job_id || !profile_id) {
    throw new AppError('Job ID and profile ID are required', 400);
  }

  const execution = await jobExecutionService.createJobExecution({
    job_id,
    profile_id,
    session_id,
    status: status || 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Job execution created successfully',
    data: execution,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, started_at, completed_at, result, error } = req.body;

  const execution = await jobExecutionService.updateJobExecution(id, {
    status,
    started_at: started_at ? new Date(started_at) : undefined,
    completed_at: completed_at ? new Date(completed_at) : undefined,
    result,
    error,
  });

  res.json({
    success: true,
    message: 'Job execution updated successfully',
    data: execution,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await jobExecutionService.deleteJobExecution(id);

  res.json({
    success: true,
    message: 'Job execution deleted successfully',
  });
});
