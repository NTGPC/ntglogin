import { Request, Response } from 'express';
import * as gpuService from '../services/gpuService';

export const getAll = async (_req: Request, res: Response) => {
  try {
    const gpuList = gpuService.getGPUList();
    return res.json({
      success: true,
      data: gpuList,
      count: gpuList.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load GPU list',
      error: error.message
    });
  }
};

export const getByAngle = async (req: Request, res: Response) => {
  try {
    const { angle } = req.params;
    if (!angle) {
      return res.status(400).json({
        success: false,
        message: 'Angle parameter is required'
      });
    }

    const decodedAngle = decodeURIComponent(angle);
    const gpu = gpuService.getGPUByAngle(decodedAngle);

    if (!gpu) {
      return res.status(404).json({
        success: false,
        message: 'GPU not found'
      });
    }

    return res.json({
      success: true,
      data: gpu
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get GPU',
      error: error.message
    });
  }
};

export const getByBrand = async (req: Request, res: Response) => {
  try {
    const { brand } = req.params;
    if (!brand) {
      return res.status(400).json({
        success: false,
        message: 'Brand parameter is required'
      });
    }

    const gpus = gpuService.getGPUsByBrand(brand);
    return res.json({
      success: true,
      data: gpus,
      count: gpus.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get GPUs by brand',
      error: error.message
    });
  }
};

