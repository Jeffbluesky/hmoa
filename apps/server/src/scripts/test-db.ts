import prisma from '../config/prisma.js';

async function testDb() {
  try {
    console.log('测试数据库连接...');

    // 测试查询
    const count = await prisma.dictionaryType.count();
    console.log('字典类型数量:', count);

    // 测试创建
    console.log('尝试创建测试数据...');
    const testType = await prisma.dictionaryType.create({
      data: {
        code: 'test_' + Date.now(),
        name: '测试类型',
        sortOrder: 1,
        isActive: true,
      },
    });
    console.log('创建成功:', testType);

    // 清理测试数据
    await prisma.dictionaryType.delete({ where: { id: testType.id } });
    console.log('清理测试数据成功');

    console.log('\n✅ 数据库连接正常');
  } catch (error: any) {
    console.error('❌ 数据库错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDb();
