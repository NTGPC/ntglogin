
import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await authService.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách user" });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const newUser = await authService.createUser(req.body);
        res.json(newUser);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo user (Có thể trùng username)" });
    }
};

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

// API Cập nhật thông tin User (Tên, Quyền, Avatar)
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName, role, avatar } = req.body;
        await prisma.user.update({
            where: { id: Number(id) },
            data: { fullName, role, avatar }
        });
        res.json({ message: "Update success" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi update user" });
    }
};

// API Đổi mật khẩu
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: Number(id) },
            data: { password: hashedPassword }
        });
        res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi đổi mật khẩu" });
    }
};

// API Xóa User
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xóa user" });
    }
};
