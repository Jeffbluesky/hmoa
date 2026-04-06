import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@hmoa.com', // 邮箱可选，但管理员账号保留
        password: hashedPassword,
        role: 'SUPER_ADMIN', // 预留角色功能
        isActive: true,
      },
    });
    console.log(`✅ Created admin user: ${admin.username} (password: admin123)`);
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  console.log('🎉 Seeding completed!');
  console.log('💡 Phase 1: 仅用户系统，其他功能后续添加');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
