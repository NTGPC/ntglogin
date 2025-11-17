import { Request, Response } from 'express';
import * as userAgentLibraryService from '../services/userAgentLibraryService';

export const getAll = async (_req: Request, res: Response) => {
  try {
    const uaList = userAgentLibraryService.getUserAgentList();
    return res.json({
      success: true,
      data: uaList,
      count: uaList.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load User-Agent list',
      error: error.message
    });
  }
};

export const getByValue = async (req: Request, res: Response) => {
  try {
    const { value } = req.params;
    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Value parameter is required'
      });
    }

    const decodedValue = decodeURIComponent(value);
    const ua = userAgentLibraryService.getUserAgentByValue(decodedValue);

    if (!ua) {
      return res.status(404).json({
        success: false,
        message: 'User-Agent not found'
      });
    }

    return res.json({
      success: true,
      data: ua
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get User-Agent',
      error: error.message
    });
  }
};

export const getByOS = async (req: Request, res: Response) => {
  try {
    const { os } = req.params;
    if (!os) {
      return res.status(400).json({
        success: false,
        message: 'OS parameter is required'
      });
    }

    const uas = userAgentLibraryService.getUserAgentsByOS(os);
    return res.json({
      success: true,
      data: uas,
      count: uas.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get User-Agents by OS',
      error: error.message
    });
  }
};

