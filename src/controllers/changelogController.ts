import { Request, Response } from 'express';
import * as changelogService from '../services/changelogService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const changelogs = await changelogService.getAllChangelogs(limit);
  res.json({
    success: true,
    data: changelogs,
  });
});

export const getByVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = req.params.version;
  const changelogs = await changelogService.getChangelogsByVersion(version);
  res.json({
    success: true,
    data: changelogs,
  });
});

export const getByType = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string;
  if (!type) {
    throw new AppError('Type parameter is required', 400);
  }
  const changelogs = await changelogService.getChangelogsByType(type);
  res.json({
    success: true,
    data: changelogs,
  });
});

export const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = req.query.category as string;
  if (!category) {
    throw new AppError('Category parameter is required', 400);
  }
  const changelogs = await changelogService.getChangelogsByCategory(category);
  res.json({
    success: true,
    data: changelogs,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { version, title, type, category, description, files, author } = req.body;

  if (!version || !title || !type) {
    throw new AppError('Version, title, and type are required', 400);
  }

  const changelog = await changelogService.createChangelog({
    version,
    title,
    type,
    category,
    description,
    files,
    author,
  });

  res.status(201).json({
    success: true,
    message: 'Changelog created successfully',
    data: changelog,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { version, title, type, category, description, files, author } = req.body;

  const changelog = await changelogService.updateChangelog(id, {
    version,
    title,
    type,
    category,
    description,
    files,
    author,
  });

  res.json({
    success: true,
    message: 'Changelog updated successfully',
    data: changelog,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await changelogService.deleteChangelog(id);

  res.json({
    success: true,
    message: 'Changelog deleted successfully',
  });
});

