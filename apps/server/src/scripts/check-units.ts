import prisma from '../config/prisma.js';

async function checkUnits() {
  try {
    // 1. 查找字典类型 code=unit
    const unitType = await prisma.dictionaryType.findUnique({
      where: { code: '规格单位' }
    });

    if (!unitType) {
      console.log('❌ 未找到字典类型 code=unit');
      console.log('现有的字典类型：');
      const types = await prisma.dictionaryType.findMany();
      types.forEach(t => console.log(`  - ${t.code}: ${t.name}`));
      return;
    }

    console.log('✅ 找到字典类型：', unitType.name, `(code: ${unitType.code})`);

    // 2. 查找该类型下的字典项
    const units = await prisma.dictionary.findMany({
      where: { typeId: unitType.id },
      orderBy: { sortOrder: 'asc' }
    });

    if (units.length === 0) {
      console.log('❌ 该类型下没有字典项');
    } else {
      console.log(`✅ 找到 ${units.length} 个单位字典项：`);
      units.forEach(u => console.log(`  - ${u.name} (code: ${u.code})`));
    }

  } catch (error: any) {
    console.error('查询失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnits();
