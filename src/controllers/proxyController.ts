import { Request, Response, NextFunction } from 'express';
import * as proxyService from '../services/proxyService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const proxies = await proxyService.getAllProxies();
  res.json({
    success: true,
    data: proxies,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const proxy = await proxyService.getProxyById(id);

  if (!proxy) {
    throw new AppError('Proxy not found', 404);
  }

  res.json({
    success: true,
    data: proxy,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { host, port, username, password, type, active } = req.body;

  if (!host || !port || !type) {
    throw new AppError('Host, port, and type are required', 400);
  }

  const proxy = await proxyService.createProxy({
    host,
    port: parseInt(port),
    username,
    password,
    type,
    active,
  });

  res.status(201).json({
    success: true,
    message: 'Proxy created successfully',
    data: proxy,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { host, port, username, password, type, active } = req.body;

  const proxy = await proxyService.updateProxy(id, {
    host,
    port: port ? parseInt(port) : undefined,
    username,
    password,
    type,
    active,
  });

  res.json({
    success: true,
    message: 'Proxy updated successfully',
    data: proxy,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await proxyService.deleteProxy(id);

  res.json({
    success: true,
    message: 'Proxy deleted successfully',
  });
});

export const check = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = await proxyService.checkProxyLive(id);
  res.json({ success: true, data: result });
});

