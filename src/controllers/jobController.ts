import { Request, Response, NextFunction } from 'express';
import * as jobService from '../services/jobService';
import * as jobExecutionService from '../services/jobExecutionService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  
  const jobs = status
    ? await jobService.getJobsByStatus(status as string)
    : await jobService.getAllJobs();

  res.json({
    success: true,
    data: jobs,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const job = await jobService.getJobById(id);

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  res.json({
    success: true,
    data: job,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { type, payload, status, scheduled_at, profile_ids } = req.body;

  if (!type || !payload) {
    throw new AppError('Type and payload are required', 400);
  }

  const job = await jobService.createJob({
    type,
    payload,
    status,
    scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
  });

  // Create job executions for each profile if provided
  if (profile_ids && Array.isArray(profile_ids) && profile_ids.length > 0) {
    await jobExecutionService.createJobExecutionsForProfiles(job.id, profile_ids);
  }

  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    data: job,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, attempts, scheduled_at } = req.body;

  const job = await jobService.updateJob(id, {
    status,
    attempts: attempts ? parseInt(attempts) : undefined,
    scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
  });

  res.json({
    success: true,
    message: 'Job updated successfully',
    data: job,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await jobService.deleteJob(id);

  res.json({
    success: true,
    message: 'Job deleted successfully',
  });
});

