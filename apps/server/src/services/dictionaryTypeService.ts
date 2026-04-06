import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateDictionaryTypeInput {
  code?: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateDictionaryTypeInput {
  code?: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

function generateCode(name: string): string {
  return (
    name
      .replace(/[^\w\u4e00-\u9fa5]/g, '')
      .toLowerCase()
      .slice(0, 20) || 'type'
  );
}

async function generateUniqueCode(name: string): Promise<string> {
  let baseCode = generateCode(name);
  let code = baseCode;
  let suffix = 1;

  while (await prisma.dictionaryType.findUnique({ where: { code } })) {
    code = `${baseCode}${suffix}`;
    suffix++;
  }

  return code;
}

export async function getDictionaryTypes() {
  return prisma.dictionaryType.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getDictionaryTypesActive() {
  return prisma.dictionaryType.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getDictionaryTypeById(id: string) {
  return prisma.dictionaryType.findUnique({
    where: { id },
    include: {
      items: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
    },
  });
}

export async function getDictionaryTypeByCode(code: string) {
  return prisma.dictionaryType.findUnique({
    where: { code },
    include: {
      items: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
    },
  });
}

export async function createDictionaryType(input: CreateDictionaryTypeInput) {
  const existingName = await prisma.dictionaryType.findFirst({
    where: { name: input.name },
  });
  if (existingName) {
    throw new AppError(409, '名称重复', 'DICT_TYPE_NAME_EXISTS');
  }

  const code = input.code?.trim()
    ? input.code.trim().toLowerCase()
    : await generateUniqueCode(input.name);

  const existingCode = await prisma.dictionaryType.findUnique({
    where: { code },
  });
  if (existingCode) {
    throw new AppError(409, '编码已存在', 'DICT_TYPE_CODE_EXISTS');
  }

  return prisma.dictionaryType.create({
    data: {
      code,
      name: input.name,
      sortOrder: input.sortOrder ?? 1,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateDictionaryType(id: string, input: UpdateDictionaryTypeInput) {
  const type = await prisma.dictionaryType.findUnique({ where: { id } });
  if (!type) {
    throw new AppError(404, '字典类型不存在', 'DICT_TYPE_NOT_FOUND');
  }

  if (input.code && input.code !== type.code) {
    const existing = await prisma.dictionaryType.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new AppError(409, '编码已存在', 'DICT_TYPE_CODE_EXISTS');
    }
  }

  return prisma.dictionaryType.update({
    where: { id },
    data: input,
  });
}

export async function deleteDictionaryType(id: string) {
  const type = await prisma.dictionaryType.findUnique({
    where: { id },
    include: { items: { take: 1 } },
  });
  if (!type) {
    throw new AppError(404, '字典类型不存在', 'DICT_TYPE_NOT_FOUND');
  }

  const PROTECTED_NAMES = ['颜色', '货币', '单位'];
  if (PROTECTED_NAMES.includes(type.name)) {
    throw new AppError(403, '系统固定类型，不可删除', 'PROTECTED_DICT_TYPE');
  }

  if (type.items.length > 0) {
    throw new AppError(409, '该字典类型下存在字典项，无法删除', 'DICT_TYPE_HAS_ITEMS');
  }

  await prisma.dictionaryType.delete({ where: { id } });
  return { id };
}

/**
 * 序号重排：按照当前排序顺序，重新从 1 开始编号
 */
export async function reorderDictionaryTypes() {
  const types = await prisma.dictionaryType.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  const updates = types
    .map((type, index) => {
      const newSortOrder = index + 1;
      if (type.sortOrder !== newSortOrder) {
        return prisma.dictionaryType.update({
          where: { id: type.id },
          data: { sortOrder: newSortOrder },
        });
      }
      return null;
    })
    .filter(Boolean) as ReturnType<typeof prisma.dictionaryType.update>[];

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return { count: updates.length };
}
