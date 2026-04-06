import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PaginationResult } from '../utils/pagination.js';

export interface CreateDictionaryInput {
  code?: string;
  name: string;
  typeId: string;
  en?: string;
  jp?: string;
  symbol?: string;
  other?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateDictionaryInput {
  code?: string;
  name?: string;
  typeId?: string;
  en?: string;
  jp?: string;
  symbol?: string;
  other?: string;
  sortOrder?: number;
  isActive?: boolean;
}

function generateCode(name: string): string {
  return (
    name
      .replace(/[^\w\u4e00-\u9fa5]/g, '')
      .toLowerCase()
      .slice(0, 20) || 'item'
  );
}

async function generateUniqueCode(name: string): Promise<string> {
  let baseCode = generateCode(name);
  let code = baseCode;
  let suffix = 1;

  while (await prisma.dictionary.findUnique({ where: { code } })) {
    code = `${baseCode}${suffix}`;
    suffix++;
  }

  return code;
}

export async function getDictionaries(
  pagination: PaginationResult,
  typeId?: string,
  keyword?: string
) {
  const where: any = {};
  if (typeId) where.typeId = typeId;
  if (keyword) {
    where.OR = [{ name: { contains: keyword } }, { code: { contains: keyword } }];
  }

  const [data, total] = await Promise.all([
    prisma.dictionary.findMany({
      where,
      include: {
        type: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.dictionary.count({ where }),
  ]);

  return { data, total };
}

export async function getDictionaryById(id: string) {
  return prisma.dictionary.findUnique({
    where: { id },
    include: {
      type: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function getDictionariesByTypeCode(typeCode: string) {
  const type = await prisma.dictionaryType.findUnique({
    where: { code: typeCode },
  });
  if (!type) {
    return [];
  }

  return prisma.dictionary.findMany({
    where: { typeId: type.id, isActive: true },
    include: {
      type: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createDictionary(input: CreateDictionaryInput) {
  const code = input.code?.trim()
    ? input.code.trim().toLowerCase()
    : await generateUniqueCode(input.name);

  const existingCode = await prisma.dictionary.findUnique({
    where: { code },
  });
  if (existingCode) {
    throw new AppError(409, '字典编码已存在', 'DICT_CODE_EXISTS');
  }

  const type = await prisma.dictionaryType.findUnique({
    where: { id: input.typeId },
  });
  if (!type) {
    throw new AppError(404, '字典类型不存在', 'DICT_TYPE_NOT_FOUND');
  }

  return prisma.dictionary.create({
    data: {
      code,
      name: input.name,
      typeId: input.typeId,
      en: input.en ? input.en.toUpperCase() : null,
      jp: input.jp ?? null,
      symbol: input.symbol ?? null,
      other: input.other ?? null,
      sortOrder: input.sortOrder ?? 1,
      isActive: input.isActive ?? true,
    },
    include: {
      type: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function updateDictionary(id: string, input: UpdateDictionaryInput) {
  const dict = await prisma.dictionary.findUnique({ where: { id } });
  if (!dict) {
    throw new AppError(404, '字典项不存在', 'DICT_NOT_FOUND');
  }

  if (input.code && input.code !== dict.code) {
    const existing = await prisma.dictionary.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new AppError(409, '字典编码已存在', 'DICT_CODE_EXISTS');
    }
  }

  if (input.typeId && input.typeId !== dict.typeId) {
    const type = await prisma.dictionaryType.findUnique({
      where: { id: input.typeId },
    });
    if (!type) {
      throw new AppError(404, '字典类型不存在', 'DICT_TYPE_NOT_FOUND');
    }
  }

  const data: Record<string, unknown> = { ...input };
  if (input.en !== undefined) {
    data.en = input.en ? input.en.toUpperCase() : null;
  }

  return prisma.dictionary.update({
    where: { id },
    data,
    include: {
      type: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function deleteDictionary(id: string) {
  const dict = await prisma.dictionary.findUnique({ where: { id } });
  if (!dict) {
    throw new AppError(404, '字典项不存在', 'DICT_NOT_FOUND');
  }

  await prisma.dictionary.delete({ where: { id } });
  return { id };
}
