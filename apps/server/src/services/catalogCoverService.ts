import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PaginationResult } from '../utils/pagination.js';
import type {
  CreateCatalogCoverInput,
  UpdateCatalogCoverInput,
} from '@hmoa/utils';

export async function getCatalogCovers(pagination: PaginationResult, type?: string) {
  const where = type
    ? { type, isActive: true }
    : { isActive: true };

  const [data, total] = await Promise.all([
    prisma.catalogCover.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.catalogCover.count({ where }),
  ]);

  return { data, total };
}

export async function getCatalogCoverById(id: string) {
  return prisma.catalogCover.findUnique({
    where: { id },
  });
}

export async function getAllCatalogCovers(type?: 'front' | 'back') {
  const where = type ? { type, isActive: true } : { isActive: true };
  return prisma.catalogCover.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCatalogCover(input: CreateCatalogCoverInput) {
  // 封面名称在相同类型下唯一
  const existing = await prisma.catalogCover.findFirst({
    where: { name: input.name, type: input.type },
  });
  if (existing) {
    throw new AppError(409, '相同类型的封面名称已存在', 'COVER_NAME_EXISTS');
  }

  return prisma.catalogCover.create({
    data: {
      name: input.name,
      type: input.type,
      url: input.url,
      thumbnail: input.thumbnail ?? null,
      size: input.size ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      mimeType: input.mimeType ?? null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateCatalogCover(id: string, input: UpdateCatalogCoverInput) {
  const cover = await prisma.catalogCover.findUnique({ where: { id } });
  if (!cover) {
    throw new AppError(404, '封面不存在', 'COVER_NOT_FOUND');
  }

  if (input.name && input.name !== cover.name) {
    const existing = await prisma.catalogCover.findFirst({
      where: {
        name: input.name,
        type: input.type ?? cover.type,
        id: { not: id },
      },
    });
    if (existing) {
      throw new AppError(409, '相同类型的封面名称已存在', 'COVER_NAME_EXISTS');
    }
  }

  const data: Record<string, unknown> = {
    name: input.name,
    type: input.type,
    url: input.url,
    thumbnail: input.thumbnail ?? null,
    size: input.size ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    mimeType: input.mimeType ?? null,
    isActive: input.isActive,
  };

  // 清理空值
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) delete data[key];
  });

  return prisma.catalogCover.update({
    where: { id },
    data,
  });
}

export async function deleteCatalogCover(id: string) {
  const cover = await prisma.catalogCover.findUnique({ where: { id } });
  if (!cover) {
    throw new AppError(404, '封面不存在', 'COVER_NOT_FOUND');
  }

  // 检查是否有目录使用此封面
  const frontCatalogCount = await prisma.catalog.count({
    where: { frontCoverId: id },
  });
  const backCatalogCount = await prisma.catalog.count({
    where: { backCoverId: id },
  });
  if (frontCatalogCount > 0 || backCatalogCount > 0) {
    throw new AppError(409, '该封面已被目录使用，无法删除', 'COVER_IN_USE');
  }

  await prisma.catalogCover.delete({ where: { id } });
  return { id };
}