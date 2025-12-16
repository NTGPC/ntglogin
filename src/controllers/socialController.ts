import { Request, Response } from 'express';
import * as socialService from '../services/socialAnalyticsService';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const scan = asyncHandler(async (req: Request, res: Response) => {
  const { channelUrl, minView, sessionId } = req.body;

  if (!channelUrl) {
    throw new AppError('channelUrl is required', 400);
  }

  let result;

  // KIỂM TRA LINK ĐỂ GỌI HÀM TƯƠNG ỨNG
  if (channelUrl.includes('tiktok.com')) {
    result = await socialService.scanTikTokChannel(channelUrl, Number(minView) || 0, sessionId || 'default-session');
  } else if (channelUrl.includes('facebook.com') || channelUrl.includes('fb.com')) {
    result = await socialService.scanFacebookPage(channelUrl, Number(minView) || 0, sessionId || 'default-session');
  } else {
    throw new AppError('❌ Link không hợp lệ! Chỉ hỗ trợ TikTok hoặc Facebook.', 400);
  }

  res.json({
    success: true,
    data: result
  });
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const videos = await socialService.getList();
  res.json(videos);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { isDownloaded } = req.body;

  if (isDownloaded === undefined) {
    throw new AppError('isDownloaded is required', 400);
  }

  const updated = await socialService.toggleStatus(id, Boolean(isDownloaded));
  res.json({
    success: true,
    data: {
      ...updated,
      viewCount: Number(updated.viewCount)
    }
  });
});

