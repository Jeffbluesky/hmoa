import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PaginationResult } from '../utils/pagination.js';
import type {
  CreateCatalogTemplateInput,
  UpdateCatalogTemplateInput,
} from '@hmoa/utils';

// 模板包含关系配置 (保留供未来扩展)
// const templateInclude = {
//   // 暂无关联数据
// } as const;

export async function getCatalogTemplates(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      }
    : undefined;

  const [data, total] = await Promise.all([
    prisma.catalogTemplate.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.catalogTemplate.count({ where }),
  ]);

  return { data, total };
}

export async function getCatalogTemplateById(id: string) {
  return prisma.catalogTemplate.findUnique({
    where: { id },
  });
}

export async function getAllCatalogTemplates() {
  return prisma.catalogTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createCatalogTemplate(input: CreateCatalogTemplateInput) {
  // 检查名称是否重复
  const existing = await prisma.catalogTemplate.findFirst({
    where: { name: input.name },
  });
  if (existing) {
    throw new AppError(409, '模板名称已存在', 'TEMPLATE_NAME_EXISTS');
  }

  return prisma.catalogTemplate.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      config: input.config,
      pageSize: input.pageSize ?? 'A4',
      orientation: input.orientation ?? 'portrait',
      margin: input.margin ?? '20',
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateCatalogTemplate(id: string, input: UpdateCatalogTemplateInput) {
  const template = await prisma.catalogTemplate.findUnique({ where: { id } });
  if (!template) {
    throw new AppError(404, '模板不存在', 'TEMPLATE_NOT_FOUND');
  }

  if (input.name && input.name !== template.name) {
    const existing = await prisma.catalogTemplate.findFirst({
      where: { name: input.name, id: { not: id } },
    });
    if (existing) {
      throw new AppError(409, '模板名称已存在', 'TEMPLATE_NAME_EXISTS');
    }
  }

  const data: Record<string, unknown> = {
    name: input.name,
    description: input.description ?? null,
    config: input.config,
    pageSize: input.pageSize,
    orientation: input.orientation,
    margin: input.margin,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };

  // 清理空值
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) delete data[key];
  });

  return prisma.catalogTemplate.update({
    where: { id },
    data,
  });
}

export async function deleteCatalogTemplate(id: string) {
  const template = await prisma.catalogTemplate.findUnique({ where: { id } });
  if (!template) {
    throw new AppError(404, '模板不存在', 'TEMPLATE_NOT_FOUND');
  }

  // 检查是否有目录使用此模板
  const catalogCount = await prisma.catalog.count({
    where: { templateId: id },
  });
  if (catalogCount > 0) {
    throw new AppError(409, '该模板已被目录使用，无法删除', 'TEMPLATE_IN_USE');
  }

  await prisma.catalogTemplate.delete({ where: { id } });
  return { id };
}

export async function getAvailableProductFields() {
  // 返回可用的产品字段列表
  return [
    { value: 'name', label: '产品名称', type: 'text' },
    { value: 'itemNo', label: '货号', type: 'code' },
    { value: 'code', label: '产品编码', type: 'code' },
    { value: 'internalCode', label: '内部编号', type: 'code' },
    { value: 'length', label: '长 (L)', type: 'dimension' },
    { value: 'width', label: '宽 (W)', type: 'dimension' },
    { value: 'height', label: '高 (H)', type: 'dimension' },
    { value: 'seatH', label: '座高 (SH)', type: 'dimension' },
    { value: 'color', label: '颜色', type: 'color' },
    { value: 'colorCode', label: '色号', type: 'color' },
    { value: 'category', label: '分类', type: 'text' },
    { value: 'colorDict', label: '颜色字典', type: 'text' },
    { value: 'mainImage', label: '主图', type: 'image' },
    { value: 'images', label: '所有图片', type: 'image' },
    { value: 'remark', label: '备注', type: 'text' },
  ];
}