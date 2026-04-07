import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PaginationResult } from '../utils/pagination.js';
import type {
  CreateCatalogInput,
  UpdateCatalogInput,
} from '@hmoa/utils';

// 目录包含关系配置
const catalogInclude = {
  template: true,
  frontCover: true,
  backCover: true,
} as const;

export async function getCatalogs(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      }
    : undefined;

  const [data, total] = await Promise.all([
    prisma.catalog.findMany({
      where,
      include: catalogInclude,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.catalog.count({ where }),
  ]);

  return { data, total };
}

export async function getCatalogById(id: string) {
  return prisma.catalog.findUnique({
    where: { id },
    include: catalogInclude,
  });
}

export async function createCatalog(input: CreateCatalogInput) {
  // 验证模板存在
  const template = await prisma.catalogTemplate.findUnique({
    where: { id: input.templateId },
  });
  if (!template) {
    throw new AppError(404, '模板不存在', 'TEMPLATE_NOT_FOUND');
  }

  // 验证封面存在（如果提供了）
  if (input.frontCoverId) {
    const frontCover = await prisma.catalogCover.findUnique({
      where: { id: input.frontCoverId, type: 'front' },
    });
    if (!frontCover) {
      throw new AppError(404, '封面不存在或类型不正确', 'FRONT_COVER_NOT_FOUND');
    }
  }

  if (input.backCoverId) {
    const backCover = await prisma.catalogCover.findUnique({
      where: { id: input.backCoverId, type: 'back' },
    });
    if (!backCover) {
      throw new AppError(404, '封底不存在或类型不正确', 'BACK_COVER_NOT_FOUND');
    }
  }

  // 验证产品存在
  const productCount = await prisma.product.count({
    where: { id: { in: input.productIds } },
  });
  if (productCount !== input.productIds.length) {
    throw new AppError(404, '部分产品不存在', 'PRODUCT_NOT_FOUND');
  }

  return prisma.catalog.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      templateId: input.templateId,
      frontCoverId: input.frontCoverId ?? null,
      backCoverId: input.backCoverId ?? null,
      productIds: input.productIds,
      status: 'pending',
    },
    include: catalogInclude,
  });
}

export async function updateCatalog(id: string, input: UpdateCatalogInput) {
  const catalog = await prisma.catalog.findUnique({ where: { id } });
  if (!catalog) {
    throw new AppError(404, '目录不存在', 'CATALOG_NOT_FOUND');
  }

  // 验证模板存在（如果更新）
  if (input.templateId) {
    const template = await prisma.catalogTemplate.findUnique({
      where: { id: input.templateId },
    });
    if (!template) {
      throw new AppError(404, '模板不存在', 'TEMPLATE_NOT_FOUND');
    }
  }

  // 验证封面存在（如果更新）
  if (input.frontCoverId) {
    const frontCover = await prisma.catalogCover.findUnique({
      where: { id: input.frontCoverId, type: 'front' },
    });
    if (!frontCover) {
      throw new AppError(404, '封面不存在或类型不正确', 'FRONT_COVER_NOT_FOUND');
    }
  }

  if (input.backCoverId) {
    const backCover = await prisma.catalogCover.findUnique({
      where: { id: input.backCoverId, type: 'back' },
    });
    if (!backCover) {
      throw new AppError(404, '封底不存在或类型不正确', 'BACK_COVER_NOT_FOUND');
    }
  }

  // 验证产品存在（如果更新）
  if (input.productIds) {
    const productCount = await prisma.product.count({
      where: { id: { in: input.productIds } },
    });
    if (productCount !== input.productIds.length) {
      throw new AppError(404, '部分产品不存在', 'PRODUCT_NOT_FOUND');
    }
  }

  const data: Record<string, unknown> = {
    name: input.name,
    description: input.description ?? null,
    templateId: input.templateId,
    frontCoverId: input.frontCoverId ?? null,
    backCoverId: input.backCoverId ?? null,
    productIds: input.productIds,
    status: input.status,
    pdfUrl: input.pdfUrl ?? null,
    pdfPath: (input as any).pdfPath ?? null,
    pdfSize: input.pdfSize ?? null,
    pageCount: input.pageCount ?? null,
    error: input.error ?? null,
    generatedAt: input.generatedAt ?? null,
  };

  // 清理空值
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) delete data[key];
  });

  return prisma.catalog.update({
    where: { id },
    data,
    include: catalogInclude,
  });
}

export async function deleteCatalog(id: string) {
  const catalog = await prisma.catalog.findUnique({ where: { id } });
  if (!catalog) {
    throw new AppError(404, '目录不存在', 'CATALOG_NOT_FOUND');
  }

  await prisma.catalog.delete({ where: { id } });
  return { id };
}

export async function getCatalogStatus(id: string) {
  const catalog = await prisma.catalog.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      pdfUrl: true,
      error: true,
      generatedAt: true,
    },
  });
  if (!catalog) {
    throw new AppError(404, '目录不存在', 'CATALOG_NOT_FOUND');
  }
  return catalog;
}

// 获取目录关联的产品详情（用于PDF生成）
export async function getCatalogProducts(catalogId: string) {
  const catalog = await prisma.catalog.findUnique({
    where: { id: catalogId },
    select: { productIds: true },
  });
  if (!catalog) {
    throw new AppError(404, '目录不存在', 'CATALOG_NOT_FOUND');
  }

  const products = await prisma.product.findMany({
    where: { id: { in: catalog.productIds as string[] } },
    include: {
      category: { select: { id: true, code: true, name: true } },
      colorDict: { select: { id: true, code: true, name: true } },
    },
  });

  return products;
}