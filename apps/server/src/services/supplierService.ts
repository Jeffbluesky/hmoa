import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PaginationResult } from '../utils/pagination.js';
import type { CreateSupplierInput, UpdateSupplierInput } from '@hmoa/types';
import { generateCode } from './sequenceService.js';

const supplierSelect = {
  id: true,
  code: true,
  name: true,
  shortName: true,
  city: true,
  typeId: true,
  contactPerson: true,
  phone: true,
  email: true,
  address: true,
  remark: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const supplierWithRelationsSelect = {
  ...supplierSelect,
  type: {
    select: {
      id: true,
      code: true,
      name: true,
      type: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
  contacts: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      position: true,
      isPrimary: true,
    },
    orderBy: { isPrimary: 'desc' },
  },
} as const;

export async function getSuppliers(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { code: { contains: keyword } },
          { name: { contains: keyword } },
          { shortName: { contains: keyword } },
          { city: { contains: keyword } },
          { contactPerson: { contains: keyword } },
          { phone: { contains: keyword } },
          { email: { contains: keyword } },
        ],
      }
    : undefined;

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      select: supplierSelect,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { suppliers, total };
}

export async function getAllSuppliers() {
  return prisma.supplier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      city: true,
      contactPerson: true,
      phone: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    select: supplierWithRelationsSelect,
  });
}

export async function createSupplier(input: CreateSupplierInput) {
  const code = await generateCode('SUP');

  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: {
        code,
        name: input.name,
        shortName: input.shortName || null,
        city: input.city || null,
        typeId: input.typeId || null,
        address: input.address || null,
        remark: input.remark || null,
        isActive: input.isActive ?? true,
      },
      select: { id: true },
    });

    if (input.contacts && input.contacts.length > 0) {
      await tx.contact.createMany({
        data: input.contacts.map((c) => ({
          supplierId: supplier.id,
          name: c.name,
          position: c.position || null,
          phone: c.phone || null,
          email: c.email || null,
          isPrimary: c.isPrimary ?? false,
        })),
      });
    }

    return tx.supplier.findUniqueOrThrow({ where: { id: supplier.id }, select: supplierWithRelationsSelect });
  });
}

export async function updateSupplier(id: string, input: UpdateSupplierInput) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw new AppError(404, '供应商不存在', 'SUPPLIER_NOT_FOUND');

  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.shortName !== undefined) data.shortName = input.shortName || null;
  if (input.city !== undefined) data.city = input.city || null;
  if (input.typeId !== undefined) data.typeId = input.typeId || null;
  if (input.address !== undefined) data.address = input.address || null;
  if (input.remark !== undefined) data.remark = input.remark || null;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return prisma.$transaction(async (tx) => {
    await tx.supplier.update({ where: { id }, data });

    if (input.contacts !== undefined) {
      await tx.contact.deleteMany({ where: { supplierId: id } });
      if (input.contacts.length > 0) {
        await tx.contact.createMany({
          data: input.contacts.map((c) => ({
            supplierId: id,
            name: c.name,
            position: c.position || null,
            phone: c.phone || null,
            email: c.email || null,
            isPrimary: c.isPrimary ?? false,
          })),
        });
      }
    }

    return tx.supplier.findUniqueOrThrow({ where: { id }, select: supplierWithRelationsSelect });
  });
}

export async function getSupplierCities(pagination: PaginationResult, keyword?: string) {
  const allSuppliers = await prisma.supplier.findMany({
    where: keyword ? { city: { contains: keyword } } : undefined,
    select: { city: true },
    orderBy: { city: 'asc' },
  });

  const uniqueCities = Array.from(
    new Set(allSuppliers.map(s => s.city).filter(Boolean))
  ).sort() as string[];

  const start = pagination.skip;
  const end = start + pagination.pageSize;
  const data = uniqueCities.slice(start, end);

  return { data, total: uniqueCities.length };
}

export async function deleteSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) {
    throw new AppError(404, '供应商不存在', 'SUPPLIER_NOT_FOUND');
  }

  // 检查是否有关联的联系人
  const contactCount = await prisma.contact.count({
    where: { supplierId: id },
  });
  if (contactCount > 0) {
    throw new AppError(400, '供应商有关联的联系人，无法删除', 'HAS_CONTACTS');
  }

  await prisma.supplier.delete({ where: { id } });
  return { id };
}