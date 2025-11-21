import { Request, Response } from 'express';
import * as proxyService from '../services/proxyService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
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
  console.log('[PROXY CREATE] Raw body:', JSON.stringify(req.body, null, 2));
  
  const { host, port, username, password, type, active } = req.body;

  // Validation
  if (!host || host.trim() === '') {
    throw new AppError('Host is required', 400);
  }
  
  if (!port) {
    throw new AppError('Port is required', 400);
  }
  
  // Convert port to number safely
  const portNumber = typeof port === 'string' ? parseInt(port, 10) : Number(port);
  if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
    throw new AppError('Port must be a valid number between 1 and 65535', 400);
  }
  
  if (!type || type.trim() === '') {
    throw new AppError('Type is required (http, socks5, socks4)', 400);
  }

  console.log('[PROXY CREATE] Validated data:', { host, port: portNumber, type, active });

  try {
    const proxy = await proxyService.createProxy({
      host: host.trim(),
      port: portNumber,
      username: username?.trim() || undefined,
      password: password || undefined,
      type: type.trim().toLowerCase(),
      active: active !== undefined ? Boolean(active) : true,
    });

    console.log('[PROXY CREATE] ✅ Proxy created successfully:', proxy.id);

    res.status(201).json({
      success: true,
      message: 'Proxy created successfully',
      data: proxy,
    });
  } catch (error: any) {
    console.error('[PROXY CREATE] ❌ Error:', error);
    // Re-throw để errorHandler xử lý
    throw error;
  }
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid proxy ID', 400);
  }

  const { host, port, username, password, type, active } = req.body;
  const updateData: any = {};

  if (host !== undefined) {
    if (host.trim() === '') {
      throw new AppError('Host cannot be empty', 400);
    }
    updateData.host = host.trim();
  }

  if (port !== undefined) {
    const portNumber = typeof port === 'string' ? parseInt(port, 10) : Number(port);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      throw new AppError('Port must be a valid number between 1 and 65535', 400);
    }
    updateData.port = portNumber;
  }

  if (type !== undefined) {
    if (type.trim() === '') {
      throw new AppError('Type cannot be empty', 400);
    }
    updateData.type = type.trim().toLowerCase();
  }

  if (username !== undefined) {
    updateData.username = username?.trim() || null;
  }

  if (password !== undefined) {
    updateData.password = password || null;
  }

  if (active !== undefined) {
    updateData.active = Boolean(active);
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  try {
    const proxy = await proxyService.updateProxy(id, updateData);
    res.json({
      success: true,
      message: 'Proxy updated successfully',
      data: proxy,
    });
  } catch (error: any) {
    console.error('[PROXY UPDATE] ❌ Error:', error);
    throw error;
  }
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

