
import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';

export const getStats = async (req: Request, res: Response) => {
    try {
        const result = await dashboardService.getDashboardStats();
        // Trả về đúng định dạng mà Frontend đang đợi
        res.status(result.status).json(result);
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server khi tải dashboard" });
    }
};
