
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Hàm đếm an toàn: Sai tên bảng cũng không làm sập app, chỉ trả về 0
const countSafe = async (modelName: string, query: Promise<number>) => {
    try {
        return await query;
    } catch (error: any) {
        console.log(`⚠️ Không tìm thấy bảng [${modelName}] hoặc bảng trống -> Trả về 0`);
        return 0;
    }
};

export const getDashboardStats = async () => {
    console.log(">>> Đang tải số liệu Dashboard...");

    // 1. Đếm các bảng cơ bản (Chắc chắn có)
    const profiles = await countSafe('Profile', prisma.profile.count());
    const proxies = await countSafe('Proxy', prisma.proxy.count());
    const sessions = await countSafe('Session', prisma.session.count());

    // 2. Đếm các bảng có thể thay đổi tên (Dựa theo log của Antigravity)
    // Thử đếm Fingerprint, nếu không có thì thử đếm FingerprintPreset (vì Schema mỗi người mỗi khác)
    let fingerprints = 0;
    if ((prisma as any).fingerprint) {
        fingerprints = await (prisma as any).fingerprint.count();
    } else if ((prisma as any).fingerprintPreset) {
        fingerprints = await (prisma as any).fingerprintPreset.count();
    }

    // 3. Đếm các bảng chức năng (Safe mode)
    // Use correct model names from schema: jobExecution, videoEditorProject
    const jobs = await countSafe('Job', (prisma as any).job?.count() || Promise.resolve(0));

    // Adjusted to use 'jobExecution' as per schema
    const executions = await countSafe('JobExecution', (prisma as any).jobExecution?.count() || Promise.resolve(0));

    const workflows = await countSafe('Workflow', (prisma as any).workflow?.count() || Promise.resolve(0));

    const twoFactor = await countSafe('TwoFactor', (prisma as any).twoFactor?.count() || Promise.resolve(0));

    // Adjusted to use 'videoEditorProject' as per schema
    const videos = await countSafe('VideoEditorProject', (prisma as any).videoEditorProject?.count() || Promise.resolve(0));

    return {
        status: 200,
        data: {
            profiles,
            proxies,
            fingerprints, // Đã fix logic tự động nhận diện tên bảng
            sessions,
            jobs,
            executions,
            workflows,
            twoFactor,
            videos
        }
    };
};
