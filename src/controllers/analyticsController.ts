import { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client';

import * as socialService from '../services/socialAnalyticsService';

const prisma = new PrismaClient();

// 1. Tạo Project

export const createSession = async (req: Request, res: Response) => {

  try {

    const { name, targetUrl, minView } = req.body;

    const session = await prisma.analyticsSession.create({

      data: { name, targetUrl, minView: Number(minView) }

    });

    res.json(session);

  } catch (e: any) { res.status(500).json({ error: e.message }); }

};

// 2. Lấy danh sách Project

export const getSessions = async (req: Request, res: Response) => {

  try {

    const list = await prisma.analyticsSession.findMany({ orderBy: { updatedAt: 'desc' } });

    res.json(list);

  } catch (e: any) { res.status(500).json({ error: e.message }); }

};

// 3. Lấy chi tiết

export const getSessionDetail = async (req: Request, res: Response) => {

  try {

    const { id } = req.params;

    const session = await prisma.analyticsSession.findUnique({

        where: { id },

        include: { videos: { orderBy: { viewCount: 'desc' } } }

    });

    

    if (session) {

        // Fix lỗi BigInt

        const videos = session.videos.map(v => ({...v, viewCount: Number(v.viewCount)}));

        res.json({ ...session, videos });

    } else {

        res.status(404).json({ error: "Not found" });

    }

  } catch (e: any) { res.status(500).json({ error: e.message }); }

};

// 4. Chạy Quét

export const runScan = async (req: Request, res: Response) => {

  try {

    const { sessionId } = req.body;

    const session = await prisma.analyticsSession.findUnique({ where: { id: sessionId } });

    

    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.targetUrl.includes('facebook')) {

        await socialService.scanFacebookPage(session.targetUrl, session.minView, sessionId);

    } else {

        await socialService.scanTikTokChannel(session.targetUrl, session.minView, sessionId);

    }

    res.json({ success: true });

  } catch (e: any) {

    res.status(500).json({ error: e.message });

  }

};

// 5. Xóa Project

export const deleteSession = async (req: Request, res: Response) => {

  try {

    const { id } = req.params;

    

    // Xóa session (Do database đã cài onDelete: Cascade, nên nó tự xóa hết video con)

    await prisma.analyticsSession.delete({

      where: { id }

    });

    

    res.json({ success: true, message: "Đã xóa project thành công" });

  } catch (e: any) {

    res.status(500).json({ error: e.message });

  }

};

// 6. Cập nhật trạng thái Video (Đã tải / Chưa tải)

export const updateVideoStatus = async (req: Request, res: Response) => {

  try {

    const { id } = req.params; // ID của Video

    const { isDownloaded } = req.body;

    

    await prisma.trackedVideo.update({

      where: { id: Number(id) },

      data: { isDownloaded: Boolean(isDownloaded) }

    });

    

    res.json({ success: true });

  } catch (e: any) {

    res.status(500).json({ error: e.message });

  }

};

// 7. Sửa thông tin Project (AN TOÀN HƠN)

export const updateSession = async (req: Request, res: Response) => {

  try {

    const { id } = req.params;

    const { name, targetUrl, minView } = req.body;

    

    // Kiểm tra xem ID có tồn tại không trước khi update

    const exists = await prisma.analyticsSession.findUnique({ where: { id } });

    

    if (!exists) {

        return res.status(404).json({ error: "Project không tồn tại hoặc đã bị xóa!" });

    }

    const updated = await prisma.analyticsSession.update({

      where: { id },

      data: { 

        name, 

        targetUrl, 

        minView: Number(minView) 

      }

    });

    

    res.json(updated);

  } catch (e: any) {

    res.status(500).json({ error: "Lỗi Server: " + e.message });

  }

};
