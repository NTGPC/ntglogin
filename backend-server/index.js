const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();

app.use(cors()); // Cho phép Web và App gọi vào
app.use(express.json({ limit: '50mb' })); // Tăng giới hạn để nhận JSON to (Workflow/Profile)

// ==========================================
// 1. API AUTH & USERS
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(404).json({ error: "User không tồn tại" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Sai mật khẩu" });

        const { password: _, ...userInfo } = user;
        res.json({ success: true, user: userInfo });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ success: true, data: users });
    } catch (e) { res.status(500).json({ error: e.message }); }
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
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 2. API PROFILES (Đã bổ sung Create/Delete)
// ==========================================
app.get('/api/profiles', async (req, res) => {
    try {
        const profiles = await prisma.profile.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: profiles });
    } catch (e) {
        console.error("Lỗi lấy profile:", e.message);
        res.json({ success: true, data: [] });
    }
});

app.post('/api/profiles', async (req, res) => {
    const { name, userAgent, config, proxy } = req.body;
    try {
        const newProfile = await prisma.profile.create({
            data: {
                name,
                userAgent: userAgent || '',
                rawProxy: proxy || '',
                avatar: config || '{}' // Lưu config fingerprint vào cột avatar (hoặc config tùy DB)
            }
        });
        res.json({ success: true, data: newProfile });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/profiles/:id', async (req, res) => {
    try {
        await prisma.profile.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 3. API WORKFLOWS
// ==========================================
app.get('/api/workflows', async (req, res) => {
    try {
        const workflows = await prisma.workflow.findMany({ orderBy: { updatedAt: 'desc' } });
        res.json({ success: true, data: workflows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/workflows', async (req, res) => {
    const { id, name, nodes, edges } = req.body;
    try {
        const nodesStr = JSON.stringify(nodes);
        const edgesStr = JSON.stringify(edges);

        let workflow;
        if (id) {
            workflow = await prisma.workflow.update({
                where: { id: Number(id) },
                data: { name, nodes: nodesStr, edges: edgesStr }
            });
        } else {
            workflow = await prisma.workflow.create({
                data: { name, nodes: nodesStr, edges: edgesStr }
            });
        }
        res.json({ success: true, data: workflow });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/workflows/:id', async (req, res) => {
    try {
        await prisma.workflow.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 4. API SUPPER FANPAGE (CAMPAIGNS)
// ==========================================
app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await prisma.campaign.findMany({
            include: { sources: true, destinations: true, tasks: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: campaigns });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/campaigns', async (req, res) => {
    const { name, backfillMode, sources, destinations } = req.body;
    try {
        const campaign = await prisma.campaign.create({
            data: {
                name,
                backfillMode,
                sources: { create: sources.map(s => ({ url: s.url, platform: s.platform })) },
                destinations: { create: destinations.map(d => ({ profileId: d.profileId, pageUrl: d.pageUrl })) }
            }
        });
        res.json({ success: true, data: campaign });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/campaigns/:id', async (req, res) => {
    const { id } = req.params;
    const { status, name } = req.body;
    try {
        const updated = await prisma.campaign.update({
            where: { id: Number(id) },
            data: {
                ...(status && { status }),
                ...(name && { name })
            }
        });
        res.json({ success: true, data: updated });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/campaigns/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        // Xóa các bảng con trước
        await prisma.contentSource.deleteMany({ where: { campaignId: id } });
        await prisma.contentDestination.deleteMany({ where: { campaignId: id } });
        await prisma.contentTask.deleteMany({ where: { campaignId: id } });

        await prisma.campaign.delete({ where: { id: id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// START SERVER
// ==========================================
app.get('/api/test', (req, res) => res.send('SERVER NGON LANH!'));

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`✅ API Server đang chạy tại: http://localhost:${PORT}`);
});
