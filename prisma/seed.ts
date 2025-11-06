import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', admin.username);

  // Create sample profiles
  const profile1 = await prisma.profile.create({
    data: {
      name: 'Profile 1 - Chrome Windows',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      fingerprint: {
        canvas: 'abc123',
        webgl: 'def456',
        audio: 'ghi789',
      },
    },
  });

  const profile2 = await prisma.profile.create({
    data: {
      name: 'Profile 2 - Firefox MacOS',
      user_agent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      fingerprint: {
        canvas: 'xyz123',
        webgl: 'uvw456',
        audio: 'rst789',
      },
    },
  });
  console.log('✅ Created profiles:', profile1.name, profile2.name);

  // Create sample proxies
  const proxy1 = await prisma.proxy.create({
    data: {
      host: '192.168.1.100',
      port: 8080,
      username: 'proxyuser1',
      password: 'proxypass1',
      type: 'http',
      active: true,
    },
  });

  const proxy2 = await prisma.proxy.create({
    data: {
      host: '192.168.1.101',
      port: 1080,
      username: 'proxyuser2',
      password: 'proxypass2',
      type: 'socks5',
      active: true,
    },
  });
  console.log('✅ Created proxies:', `${proxy1.host}:${proxy1.port}`, `${proxy2.host}:${proxy2.port}`);

  // Create sample sessions
  const session1 = await prisma.session.create({
    data: {
      profile_id: profile1.id,
      proxy_id: proxy1.id,
      status: 'idle',
      meta: {
        lastActivity: new Date().toISOString(),
      },
    },
  });

  const session2 = await prisma.session.create({
    data: {
      profile_id: profile2.id,
      proxy_id: proxy2.id,
      status: 'running',
      started_at: new Date(),
      meta: {
        lastActivity: new Date().toISOString(),
      },
    },
  });
  console.log('✅ Created sessions:', session1.id, session2.id);

  // Create sample jobs
  const job1 = await prisma.job.create({
    data: {
      type: 'profile_sync',
      payload: {
        profileId: profile1.id,
        action: 'sync_cookies',
      },
      status: 'queued',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      type: 'proxy_check',
      payload: {
        proxyIds: [proxy1.id, proxy2.id],
      },
      status: 'processing',
    },
  });
  console.log('✅ Created jobs:', job1.type, job2.type);

  // Create sample logs
  await prisma.log.createMany({
    data: [
      {
        level: 'info',
        message: 'Application started successfully',
        meta: { timestamp: new Date().toISOString() },
      },
      {
        level: 'warn',
        message: 'High memory usage detected',
        meta: { usage: '85%' },
      },
      {
        level: 'error',
        message: 'Failed to connect to proxy',
        meta: { proxyId: proxy1.id, error: 'Connection timeout' },
      },
    ],
  });
  console.log('✅ Created logs');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

