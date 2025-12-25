const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();

app.use(cors()); // Cho phép Web và App gọi vào
app.use(express.json());

// --- API AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(404).json({ error: "User không tồn tại" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Sai mật khẩu" });

        const { password: _, ...userInfo } = user;
        res.json({ success: true, user: userInfo });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- API USER ---
app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
});

app.post('/api/users', async (req, res) => {
    const { username, password, fullName, role, avatarConfig } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                fullName,
                role: role || 'USER',
                avatar: JSON.stringify(avatarConfig)
            }
        });
        res.json({ success: true, data: newUser });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- API WORKFLOWS ---

// 1. Lấy danh sách
app.get('/api/workflows', async (req, res) => {
    try {
        const workflows = await prisma.workflow.findMany({ orderBy: { updatedAt: 'desc' } });
        res.json({ success: true, data: workflows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Tạo mới / Cập nhật
app.post('/api/workflows', async (req, res) => {
    const { id, name, nodes, edges } = req.body;
    try {
        // Chuyển object sang string để lưu vào DB
        const nodesStr = JSON.stringify(nodes);
        const edgesStr = JSON.stringify(edges);

        let workflow;
        if (id) {
            // Update nếu có ID
            workflow = await prisma.workflow.update({
                where: { id: Number(id) },
                data: { name, nodes: nodesStr, edges: edgesStr }
            });
        } else {
            // Create mới
            workflow = await prisma.workflow.create({
                data: { name, nodes: nodesStr, edges: edgesStr }
            });
        }
        res.json({ success: true, data: workflow });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Xóa
app.delete('/api/workflows/:id', async (req, res) => {
    try {
        await prisma.workflow.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- KHỞI CHẠY SERVER ---
const PORT = 4000; // Chạy cổng 4000 để không đụng cổng 3000 cũ
app.listen(PORT, () => {
    console.log(`✅ API Server đang chạy tại: http://localhost:${PORT}`);
});
