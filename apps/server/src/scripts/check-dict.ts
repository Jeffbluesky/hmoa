import prisma from '../config/prisma.js';

async function checkDict() {
  try {
    console.log('=== 字典类型 ===');
    const types = await prisma.dictionaryType.findMany({
      include: { items: true }
    });
    console.log(`共 ${types.length} 个类型:`);
    for (const t of types) {
      console.log(`  - ${t.code} (${t.name}): ${t.items.length} 个字典项`);
      for (const item of t.items) {
        console.log(`      • ${item.code} = ${item.name}`);
      }
    }

    console.log('\n=== 所有字典项 ===');
    const allDicts = await prisma.dictionary.findMany({
      include: { type: true }
    });
    console.log(`共 ${allDicts.length} 个字典项:`);
    for (const d of allDicts) {
      console.log(`  - ${d.code} (${d.name}) [类型: ${d.type?.code}]`);
    }

    console.log('\n=== 材料 ===');
    const materials = await prisma.material.findMany();
    console.log(`共 ${materials.length} 个材料`);
    for (const m of materials) {
      console.log(`  - ${m.code} (${m.name})`);
    }

  } catch (error: any) {
    console.error('查询失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDict();
