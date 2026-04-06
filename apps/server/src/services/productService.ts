import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateCode } from './sequenceService.js';
import type { PaginationResult } from '../utils/pagination.js';

export interface ProductBOMInput {
  materialId?: string;
  childProductId?: string;
  quantity: number;
  remark?: string;
}

export interface CreateProductInput {
  name: string;
  itemNo?: string;
  length?: string;
  width?: string;
  height?: string;
  seatH?: string;
  color?: string;
  colorCode?: string;
  categoryId?: string;
  colorDictId?: string;
  materialId?: string;
  remark?: string;
  images?: string[];
  attachments?: { name: string; url: string; type?: string; size?: number }[];
  boms?: ProductBOMInput[];
}

export interface UpdateProductInput {
  name?: string;
  itemNo?: string;
  length?: string;
  width?: string;
  height?: string;
  seatH?: string;
  color?: string;
  colorCode?: string;
  categoryId?: string;
  colorDictId?: string;
  materialId?: string;
  remark?: string;
  images?: string[];
  attachments?: { name: string; url: string; type?: string; size?: number }[];
  boms?: ProductBOMInput[];
}

const productDetailInclude = {
  category: { select: { id: true, code: true, name: true } },
  colorDict: { select: { id: true, code: true, name: true } },
  boms: {
    include: {
      material: { select: { id: true, code: true, name: true } },
      childProduct: { select: { id: true, code: true, name: true } },
    },
  },
} as const;

export async function getProducts(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { internalCode: { contains: keyword } },
          { itemNo: { contains: keyword } },
        ],
      }
    : undefined;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, code: true, name: true } },
        colorDict: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, code: true, name: true } },
      colorDict: { select: { id: true, code: true, name: true } },
      boms: {
        include: {
          material: { select: { id: true, code: true, name: true } },
          childProduct: { select: { id: true, code: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    include: {
      category: { select: { id: true, code: true, name: true } },
      colorDict: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProduct(input: CreateProductInput) {
  if (input.itemNo) {
    const existing = await prisma.product.findFirst({ where: { itemNo: input.itemNo } });
    if (existing) {
      throw new AppError(409, '货号已存在', 'ITEM_NO_EXISTS');
    }
  }

  const internalCode = await generateCode('HM');

  let productCode: string;
  if (input.categoryId) {
    const category = await prisma.dictionary.findUnique({
      where: { id: input.categoryId },
      select: { code: true },
    });
    const prefix = category?.code ? category.code.toUpperCase() : 'PRO';
    productCode = await generateCode(prefix);
  } else {
    productCode = await generateCode('PRO');
  }

  const boms = input.boms ?? [];
  validateBOMs(boms);

  return prisma.product.create({
    data: {
      internalCode,
      code: productCode,
      name: input.name,
      itemNo: input.itemNo!.toUpperCase(),
      length: input.length ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      seatH: input.seatH ?? null,
      color: input.color ?? null,
      colorCode: input.colorCode ?? null,
      categoryId: input.categoryId ?? null,
      colorDictId: input.colorDictId ?? null,
      materialId: input.materialId ?? null,
      remark: input.remark ?? null,
      images: input.images ? JSON.stringify(input.images) : null,
      attachments: input.attachments ? JSON.stringify(input.attachments) : null,
      boms: {
        create: boms.map((bom) => ({
          materialId: bom.materialId ?? null,
          childProductId: bom.childProductId ?? null,
          quantity: bom.quantity,
          remark: bom.remark ?? null,
        })),
      },
    },
    include: productDetailInclude,
  });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError(404, '产品不存在', 'PRODUCT_NOT_FOUND');
  }

  if (input.itemNo) {
    const existing = await prisma.product.findFirst({
      where: { itemNo: input.itemNo, id: { not: id } },
    });
    if (existing) {
      throw new AppError(409, '货号已存在', 'ITEM_NO_EXISTS');
    }
  }

  const data: Record<string, unknown> = {
    name: input.name,
    itemNo: input.itemNo ? input.itemNo.toUpperCase() : null,
    length: input.length ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    seatH: input.seatH ?? null,
    color: input.color ?? null,
    colorCode: input.colorCode ?? null,
    categoryId: input.categoryId ?? null,
    colorDictId: input.colorDictId ?? null,
    materialId: input.materialId ?? null,
    remark: input.remark ?? null,
  };

  // 仅在传入时更新图片/附件
  if (input.images !== undefined) {
    data.images = input.images ? JSON.stringify(input.images) : null;
  }
  if (input.attachments !== undefined) {
    data.attachments = input.attachments ? JSON.stringify(input.attachments) : null;
  }

  // 清理空字符串
  if (data.itemNo === '') data.itemNo = null;
  if (data.colorCode === '') data.colorCode = null;
  if (data.remark === '') data.remark = null;

  if (input.boms) {
    validateBOMs(input.boms);
    await prisma.productBOM.deleteMany({ where: { productId: id } });
    (data as any).boms = {
      create: input.boms.map((bom) => ({
        materialId: bom.materialId ?? null,
        childProductId: bom.childProductId ?? null,
        quantity: bom.quantity,
        remark: bom.remark ?? null,
      })),
    };
  }

  return prisma.product.update({
    where: { id },
    data,
    include: productDetailInclude,
  });
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError(404, '产品不存在', 'PRODUCT_NOT_FOUND');
  }

  await prisma.product.delete({ where: { id } });
  return { id };
}

function validateBOMs(boms: ProductBOMInput[]) {
  for (const bom of boms) {
    if (!bom.materialId && !bom.childProductId) {
      throw new AppError(400, 'BOM 行必须选择材料或子产品其一', 'INVALID_BOM');
    }
    if (bom.materialId && bom.childProductId) {
      throw new AppError(400, 'BOM 行不能同时选择材料和子产品', 'INVALID_BOM');
    }
    if (bom.quantity <= 0) {
      throw new AppError(400, 'BOM 用量必须大于 0', 'INVALID_BOM');
    }
  }
}
