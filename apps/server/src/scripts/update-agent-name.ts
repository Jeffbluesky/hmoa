import prisma from '../config/prisma.js';

async function updateAgentName() {
  try {
    console.log('正在查找"客户代理"字典项...');

    // 首先找到"客户类型"字典类型
    const customerType = await prisma.dictionaryType.findFirst({
      where: { code: '客户类型' },
      include: { items: true }
    });

    if (!customerType) {
      console.error('未找到"客户类型"字典类型');
      return;
    }

    console.log(`找到"客户类型"字典类型: ${customerType.name} (${customerType.code})`);

    // 找到"客户代理"字典项
    const agentItem = customerType.items.find(item => item.code === '客户代理');

    if (!agentItem) {
      console.error('未找到"客户代理"字典项');
      return;
    }

    console.log(`找到"客户代理"字典项: ${agentItem.name} (${agentItem.code})`);

    // 更新名称为"代理"
    const updated = await prisma.dictionary.update({
      where: { id: agentItem.id },
      data: { name: '代理' }
    });

    console.log(`✅ 成功更新字典项名称: ${agentItem.name} -> ${updated.name}`);

    // 验证更新
    const verifyItem = await prisma.dictionary.findUnique({
      where: { id: agentItem.id }
    });

    console.log(`验证: ${verifyItem?.code} = ${verifyItem?.name}`);

  } catch (error: any) {
    console.error('更新失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAgentName();