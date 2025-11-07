import { Request, Response } from 'express';
import * as sessionService from '../services/sessionService';
import { getOpenPageUrls } from '../services/browserService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const sessions = await sessionService.getAllSessions();
  res.json({
    success: true,
    data: sessions,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const session = await sessionService.getSessionById(id);

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  res.json({
    success: true,
    data: session,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { profile_id, proxy_id, status, meta } = req.body;

  if (!profile_id) {
    throw new AppError('Profile ID is required', 400);
  }

  try {
    const session = await sessionService.createSession({
      profile_id: parseInt(profile_id),
      proxy_id: proxy_id ? parseInt(proxy_id) : undefined,
      status,
      meta,
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    // Make sure error message is user-friendly
    const errorMessage = error?.message || 'Failed to create session';
    throw new AppError(errorMessage, 500);
  }
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, started_at, stopped_at, meta } = req.body;

  const session = await sessionService.updateSession(id, {
    status,
    started_at: started_at ? new Date(started_at) : undefined,
    stopped_at: stopped_at ? new Date(stopped_at) : undefined,
    meta,
  });

  res.json({
    success: true,
    message: 'Session updated successfully',
    data: session,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await sessionService.deleteSession(id);

  res.json({
    success: true,
    message: 'Session deleted successfully',
  });
});

// Capture current open tabs and save to profile fingerprint.savedTabs
export const captureTabs = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const session = await sessionService.getSessionById(id);
  if (!session) {
    throw new AppError('Session not found', 404);
  }
  const urls = await getOpenPageUrls(id);
  // Update profile fingerprint JSON with savedTabs
  await sessionService.updateProfileFingerprint(session.profile_id, { savedTabs: urls });
  res.json({ success: true, data: { urls, profileId: session.profile_id } });
});

