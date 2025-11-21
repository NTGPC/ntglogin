import { Request, Response } from 'express';
import * as userAgentService from '../services/userAgentService';
import { asyncHandler } from '../utils/errorHandler';
import { AppError } from '../utils/errorHandler';

// GET /api/user-agents
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { os, minVersion, maxVersion } = req.query;
  
  let userAgents;
  if (os) {
    userAgents = await userAgentService.getUserAgentsByOS(os as string);
  } else if (minVersion && maxVersion) {
    userAgents = await userAgentService.getUserAgentsByBrowserVersion(
      parseInt(minVersion as string, 10),
      parseInt(maxVersion as string, 10)
    );
  } else {
    userAgents = await userAgentService.getAllUserAgents();
  }
  
  res.json({
    success: true,
    data: userAgents,
  });
});

// GET /api/user-agents/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid user agent ID', 400);
  }
  
  const userAgent = await userAgentService.getUserAgentById(id);
  if (!userAgent) {
    throw new AppError('User agent not found', 404);
  }
  
  res.json({
    success: true,
    data: userAgent,
  });
});

// POST /api/user-agents
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, value, os, platform, uaPlatform, uaPlatformVersion, uaFullVersion, browserVersion } = req.body;
  
  if (!name || !value || !os || !platform) {
    throw new AppError('Missing required fields: name, value, os, platform', 400);
  }
  
  const userAgent = await userAgentService.createUserAgent({
    name,
    value,
    os,
    platform,
    uaPlatform,
    uaPlatformVersion,
    uaFullVersion,
    browserVersion: browserVersion ? parseInt(String(browserVersion), 10) : undefined,
  });
  
  res.status(201).json({
    success: true,
    message: 'User agent created successfully',
    data: userAgent,
  });
});

// PATCH /api/user-agents/:id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid user agent ID', 400);
  }
  
  const { id: _bodyId, ...updateData } = req.body;
  
  // Convert browserVersion to number if provided
  if (updateData.browserVersion !== undefined) {
    updateData.browserVersion = parseInt(String(updateData.browserVersion), 10);
  }
  
  const userAgent = await userAgentService.updateUserAgent(id, updateData);
  
  res.json({
    success: true,
    message: 'User agent updated successfully',
    data: userAgent,
  });
});

// DELETE /api/user-agents/:id
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid user agent ID', 400);
  }
  
  await userAgentService.deleteUserAgent(id);
  
  res.json({
    success: true,
    message: 'User agent deleted successfully',
  });
});

// GET /api/user-agents/os/:os
export const getByOS = asyncHandler(async (req: Request, res: Response) => {
  const os = req.params.os;
  if (!os) {
    throw new AppError('OS parameter is required', 400);
  }
  
  const userAgents = await userAgentService.getUserAgentsByOS(os);
  
  res.json({
    success: true,
    data: userAgents,
  });
});

// GET /api/user-agents/value/:value
export const getByValue = asyncHandler(async (req: Request, res: Response) => {
  const value = decodeURIComponent(req.params.value);
  if (!value) {
    throw new AppError('Value parameter is required', 400);
  }
  
  const userAgents = await userAgentService.getAllUserAgents();
  const userAgent = userAgents.find(ua => ua.value === value);
  
  if (!userAgent) {
    throw new AppError('User agent not found', 404);
  }
  
  res.json({
    success: true,
    data: userAgent,
  });
});

