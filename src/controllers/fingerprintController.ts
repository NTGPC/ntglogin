import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { asyncHandler, AppError } from '../utils/errorHandler';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const fps = await prisma.fingerprint.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: fps });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, data } = req.body;
  if (!data) throw new AppError('data is required', 400);
  const fp = await prisma.fingerprint.create({ data: { name, data } });
  res.status(201).json({ success: true, data: fp });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.fingerprint.delete({ where: { id } });
  res.json({ success: true });
});


