import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateCode } from './sequenceService.js';
import type { PaginationResult } from '../utils/pagination.js';

export interface CreateMaterialInput {
  name: string;
  specification: string;
  color?: string;
  colorCode?: string;
  unitId: string;
  supplierId?: string;
  remark?: string;
}

export interface UpdateMaterialInput {
  name?: string;
  specification?: string;
  color?: string;
  colorCode?: string;
  unitId?: string;
  supplierId?: string;
  remark?: string;
}

export async function getMaterials(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { code: { contains: keyword } },
        ],
      }
    : undefined;

  const [data, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: {
        unit: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.material.count({ where }),
  ]);

  return { data, total };
}

export async function getAllMaterials() {
  return prisma.material.findMany({
    include: {
      unit: { select: { id: true, code: true, name: true } },
      supplier: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMaterialNames(pagination: PaginationResult, keyword?: string) {
  // 获取所有去重后的材料名称
  const allMaterials = await prisma.material.findMany({
    where: keyword ? { name: { contains: keyword } } : undefined,
    select: { name: true },
    orderBy: { name: 'asc' },
  });

  // 去重并排序
  const uniqueNames = Array.from(new Set(allMaterials.map(m => m.name))).sort();
  const total = uniqueNames.length;

  // 内存分页
  const startIndex = pagination.skip;
  const endIndex = startIndex + pagination.pageSize;
  const data = uniqueNames.slice(startIndex, endIndex);

  return { data, total };
}

export async function getMaterialById(id: string) {
  return prisma.material.findUnique({
    where: { id },
  });
}

export async function createMaterial(input: CreateMaterialInput) {
  const code = await generateCode('MA');

  return prisma.material.create({
    data: {
      code,
      name: input.name,
      specification: input.specification,
      color: input.color ?? null,
      colorCode: input.colorCode ?? null,
      unitId: input.unitId,
      supplierId: input.supplierId ?? null,
      remark: input.remark ?? null,
    },
  });
}

export async function updateMaterial(id: string, input: UpdateMaterialInput) {
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) {
    throw new AppError(404, '材料不存在', 'MATERIAL_NOT_FOUND');
  }

  const data: Record<string, unknown> = { ...input };
  if (input.specification === '') data.specification = null;
  if (input.color === '') data.color = null;
  if (input.colorCode === '') data.colorCode = null;
  if (input.remark === '') data.remark = null;
  if (input.unitId === '') data.unitId = null;
  if (input.supplierId === '') data.supplierId = null;

  return prisma.material.update({
    where: { id },
    data,
  });
}

export async function deleteMaterial(id: string) {
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) {
    throw new AppError(404, '材料不存在', 'MATERIAL_NOT_FOUND');
  }

  await prisma.material.delete({ where: { id } });
  return { id };
}
