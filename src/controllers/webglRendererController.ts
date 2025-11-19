import { Request, Response } from 'express';
import * as webglRendererService from '../services/webglRendererService';
import { asyncHandler } from '../utils/errorHandler';
import { AppError } from '../utils/errorHandler';

// GET /api/webgl-renderers
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { os, vendor } = req.query;
  
  let renderers;
  if (os) {
    renderers = await webglRendererService.getWebglRenderersByOS(os as string);
  } else if (vendor) {
    renderers = await webglRendererService.getWebglRenderersByVendor(vendor as string);
  } else {
    renderers = await webglRendererService.getAllWebglRenderers();
  }
  
  res.json({
    success: true,
    data: renderers,
  });
});

// GET /api/webgl-renderers/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid WebGL renderer ID', 400);
  }
  
  const renderer = await webglRendererService.getWebglRendererById(id);
  if (!renderer) {
    throw new AppError('WebGL renderer not found', 404);
  }
  
  res.json({
    success: true,
    data: renderer,
  });
});

// POST /api/webgl-renderers
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { vendor, renderer, os } = req.body;
  
  if (!vendor || !renderer) {
    throw new AppError('Missing required fields: vendor, renderer', 400);
  }
  
  const webglRenderer = await webglRendererService.createWebglRenderer({
    vendor,
    renderer,
    os,
  });
  
  res.status(201).json({
    success: true,
    message: 'WebGL renderer created successfully',
    data: webglRenderer,
  });
});

// PATCH /api/webgl-renderers/:id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid WebGL renderer ID', 400);
  }
  
  const { id: _bodyId, ...updateData } = req.body;
  
  const webglRenderer = await webglRendererService.updateWebglRenderer(id, updateData);
  
  res.json({
    success: true,
    message: 'WebGL renderer updated successfully',
    data: webglRenderer,
  });
});

// DELETE /api/webgl-renderers/:id
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid WebGL renderer ID', 400);
  }
  
  await webglRendererService.deleteWebglRenderer(id);
  
  res.json({
    success: true,
    message: 'WebGL renderer deleted successfully',
  });
});

