import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PaginationResult } from '../utils/pagination.js';
import type { CreateCustomerInput, UpdateCustomerInput } from '@hmoa/types';
import { generateCode } from './sequenceService.js';

const customerSelect = {
  id: true,
  code: true,
  name: true,
  shortName: true,
  typeId: true,
  country: true,
  contactPerson: true,
  phone: true,
  email: true,
  address: true,
  remark: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  finalCustomerId: true,
} as const;

const customerWithRelationsSelect = {
  ...customerSelect,
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
  finalCustomer: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} as const;

export async function getCustomers(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { code: { contains: keyword } },
          { name: { contains: keyword } },
          { shortName: { contains: keyword } },
          { contactPerson: { contains: keyword } },
          { phone: { contains: keyword } },
          { email: { contains: keyword } },
        ],
      }
    : undefined;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: customerSelect,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total };
}

export async function getAllCustomers() {
  return prisma.customer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
      country: true,
      typeId: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    select: customerWithRelationsSelect,
  });
}

export async function createCustomer(input: CreateCustomerInput) {
  const code = await generateCode('CUST');

  if (input.finalCustomerId) {
    const finalCustomer = await prisma.customer.findUnique({ where: { id: input.finalCustomerId } });
    if (!finalCustomer) throw new AppError(400, '最终客户不存在', 'FINAL_CUSTOMER_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        code,
        name: input.name,
        shortName: input.shortName || null,
        typeId: input.typeId || null,
        country: input.country || null,
        address: input.address || null,
        remark: input.remark || null,
        isActive: input.isActive ?? true,
        finalCustomerId: input.finalCustomerId || null,
      },
      select: { id: true },
    });

    if (input.contacts && input.contacts.length > 0) {
      await tx.contact.createMany({
        data: input.contacts.map((c) => ({
          customerId: customer.id,
          name: c.name,
          position: c.position || null,
          phone: c.phone || null,
          email: c.email || null,
          isPrimary: c.isPrimary ?? false,
        })),
      });
    }

    return tx.customer.findUniqueOrThrow({ where: { id: customer.id }, select: customerWithRelationsSelect });
  });
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new AppError(404, '客户不存在', 'CUSTOMER_NOT_FOUND');

  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.shortName !== undefined) data.shortName = input.shortName || null;
  if (input.typeId !== undefined) data.typeId = input.typeId || null;
  if (input.country !== undefined) data.country = input.country || null;
  if (input.address !== undefined) data.address = input.address || null;
  if (input.remark !== undefined) data.remark = input.remark || null;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.finalCustomerId !== undefined) {
    if (input.finalCustomerId) {
      const finalCustomer = await prisma.customer.findUnique({ where: { id: input.finalCustomerId } });
      if (!finalCustomer) throw new AppError(400, '最终客户不存在', 'FINAL_CUSTOMER_NOT_FOUND');
    }
    data.finalCustomerId = input.finalCustomerId || null;
  }

  return prisma.$transaction(async (tx) => {
    await tx.customer.update({ where: { id }, data });

    if (input.contacts !== undefined) {
      await tx.contact.deleteMany({ where: { customerId: id } });
      if (input.contacts.length > 0) {
        await tx.contact.createMany({
          data: input.contacts.map((c) => ({
            customerId: id,
            name: c.name,
            position: c.position || null,
            phone: c.phone || null,
            email: c.email || null,
            isPrimary: c.isPrimary ?? false,
          })),
        });
      }
    }

    return tx.customer.findUniqueOrThrow({ where: { id }, select: customerWithRelationsSelect });
  });
}

export async function deleteCustomer(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new AppError(404, '客户不存在', 'CUSTOMER_NOT_FOUND');
  }

  // 检查是否有关联的联系人
  const contactCount = await prisma.contact.count({
    where: { customerId: id },
  });
  if (contactCount > 0) {
    throw new AppError(400, '客户有关联的联系人，无法删除', 'HAS_CONTACTS');
  }

  await prisma.customer.delete({ where: { id } });
  return { id };
}

export async function getCustomerCountries(pagination: PaginationResult, keyword?: string) {
  // 获取所有客户的国家字段
  const allCustomers = await prisma.customer.findMany({
    where: keyword
      ? {
          country: { contains: keyword },
        }
      : undefined,
    select: { country: true },
    orderBy: { country: 'asc' },
  });

  // 去重并过滤掉null/空值
  const uniqueCountries = Array.from(
    new Set(allCustomers.map(c => c.country).filter(Boolean))
  ).sort();

  // 分页处理
  const start = pagination.skip;
  const end = start + pagination.pageSize;
  const data = uniqueCountries.slice(start, end);

  return { data, total: uniqueCountries.length };
}

