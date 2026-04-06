import prisma from '../config/prisma.js';

async function deletePrefix() {
  try {
    // 1. 查找 PREFIX 类型
    const prefixType = await prisma.dictionaryType.findUnique({
      where: { code: 'PREFIX' },
      include: { items: true }
    });

    if (!prefixType) {
      console.log('PREFIX 类型不存在');
      return;
    }

    console.log('找到 PREFIX 类型:', prefixType.name, 'ID:', prefixType.id);
    console.log('旗下字典项:', prefixType.items.map(i => i.code).join(', '));

    // 2. 获取所有 PREFIX 类型的字典项ID
    const prefixItemIds = prefixType.items.map(i => i.id);

    // 3. 查找使用这些字典项的产品
    const productsWithPrefix = await prisma.product.findMany({
      where: { dictionaryId: { in: prefixItemIds } }
    });

    console.log(`找到 ${productsWithPrefix.length} 个使用 PREFIX 分类的产品`);

    // 4. 删除使用这些分类的 ProductBOM 记录（先删子表）
    for (const product of productsWithPrefix) {
      await prisma.productBOM.deleteMany({
        where: { productId: product.id }
      });
    }
    console.log('已清理相关产品的 BOM 数据');

    // 5. 删除产品
    if (productsWithPrefix.length > 0) {
      await prisma.product.deleteMany({
        where: { dictionaryId: { in: prefixItemIds } }
      });
      console.log('已删除相关产品');
    }

    // 6. 删除 PREFIX 类型下的所有字典项
    await prisma.dictionary.deleteMany({
      where: { typeId: prefixType.id }
    });
    console.log('已删除 PREFIX 类型下的所有字典项');

    // 7. 删除 PREFIX 类型
    await prisma.dictionaryType.delete({
      where: { id: prefixType.id }
    });
    console.log('已删除 PREFIX 类型');

    console.log('\n✅ PREFIX 类型及其相关数据已完全删除');

  } catch (error: any) {
    console.error('删除失败:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

deletePrefix();
