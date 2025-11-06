import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profileService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const profiles = await profileService.getAllProfiles();
  res.json({
    success: true,
    data: profiles,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const profile = await profileService.getProfileById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  res.json({
    success: true,
    data: profile,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, user_agent, fingerprint } = req.body;

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  const profile = await profileService.createProfile({
    name,
    user_agent,
    fingerprint,
  });

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: profile,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, user_agent, fingerprint } = req.body;

  const profile = await profileService.updateProfile(id, {
    name,
    user_agent,
    fingerprint,
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await profileService.deleteProfile(id);

  res.json({
    success: true,
    message: 'Profile deleted successfully',
  });
});

export const getFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const profile = await profileService.getProfileById(id);

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  const fp = profile.fingerprint || {};
  res.json({ success: true, data: fp });
});

export const updateFingerprint = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const fp = req.body;
  const updated = await profileService.updateProfile(id, { fingerprint: fp });
  res.json({ success: true, data: updated.fingerprint });
});

