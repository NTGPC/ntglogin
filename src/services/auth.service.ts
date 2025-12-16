
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SECRET_KEY = "NTG_SECRET_KEY_PRO_VIP_123"; // TODO: Move to .env

// Hàm khởi tạo Admin mặc định (Chạy khi server start)
export const initAdminAccount = async () => {
    try {
        const count = await prisma.user.count();
        if (count === 0) {
            const hashedPassword = await bcrypt.hash("123456", 10);
            await prisma.user.create({
                data: {
                    username: "admin",
                    password: hashedPassword,
                    fullName: "Super Admin",
                    role: "ADMIN"
                }
            });
            console.log(">>> Đã tạo tài khoản mặc định: admin / 123456");
        }
    } catch (error) {
        console.error("Lỗi khi tạo admin mặc định:", error);
    }
};

export const login = async (username: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error("User không tồn tại");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Sai mật khẩu");

    const token = jwt.sign({ id: user.id, role: user.role, fullName: user.fullName }, SECRET_KEY, { expiresIn: '7d' });
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            avatar: user.avatar
        }
    };
};

export const createUser = async (data: any) => {
    // Chỉ tạo user mới. Password mặc định hoặc do admin đặt
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
        data: { ...data, password: hashedPassword }
    });
};

export const getAllUsers = async () => {
    return prisma.user.findMany({
        select: { id: true, username: true, fullName: true, role: true, createdAt: true } // Không lấy password
    });
};
