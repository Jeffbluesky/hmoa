import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PaginationResult } from '../utils/pagination.js';
import type { CreateContactInput, UpdateContactInput } from '@hmoa/types';

const contactSelect = {
  id: true,
  customerId: true,
  supplierId: true,
  name: true,
  phone: true,
  email: true,
  position: true,
  isPrimary: true,
  remark: true,
  createdAt: true,
  updatedAt: true,
} as const;

const contactWithRelationsSelect = {
  ...contactSelect,
  customer: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  supplier: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} as const;

export async function getContacts(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { phone: { contains: keyword } },
          { email: { contains: keyword } },
          { position: { contains: keyword } },
        ],
      }
    : undefined;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      select: contactWithRelationsSelect,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total };
}

export async function getContactsByCustomerId(customerId: string) {
  return prisma.contact.findMany({
    where: { customerId },
    select: contactSelect,
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  });
}


export async function getContactsBySupplierId(supplierId: string) {
  return prisma.contact.findMany({
    where: { supplierId },
    select: contactSelect,
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  });
}

export async function getContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    select: contactWithRelationsSelect,
  });
}

export async function createContact(input: CreateContactInput) {
  // 验证只能关联一个实体
  const entityCount = [input.customerId, input.supplierId].filter(Boolean).length;
  if (entityCount !== 1) {
    throw new AppError(400, '联系人必须且只能关联客户或供应商之一', 'INVALID_ASSOCIATION');
  }

  // 如果设置为主要联系人，更新其他联系人的isPrimary状态
  if (input.isPrimary) {
    const where: any = {};
    if (input.customerId) where.customerId = input.customerId;
    if (input.supplierId) where.supplierId = input.supplierId;

    await prisma.contact.updateMany({
      where: { ...where, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.contact.create({
    data: {
      customerId: input.customerId || null,
      supplierId: input.supplierId || null,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      position: input.position || null,
      isPrimary: input.isPrimary ?? false,
      remark: input.remark || null,
    },
    select: contactWithRelationsSelect,
  });
}

export async function updateContact(id: string, input: UpdateContactInput) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) {
    throw new AppError(404, '联系人不存在', 'CONTACT_NOT_FOUND');
  }

  // 验证关联实体变更
  if (
    (input.customerId !== undefined && input.customerId !== contact.customerId) ||
    (input.supplierId !== undefined && input.supplierId !== contact.supplierId)
  ) {
    throw new AppError(400, '不能修改联系人的关联实体', 'CANNOT_CHANGE_ASSOCIATION');
  }

  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone || null;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.position !== undefined) data.position = input.position || null;
  if (input.remark !== undefined) data.remark = input.remark || null;

  // 处理主要联系人设置
  if (input.isPrimary !== undefined && input.isPrimary !== contact.isPrimary) {
    if (input.isPrimary) {
      const where: any = {};
      if (contact.customerId) where.customerId = contact.customerId;
      if (contact.supplierId) where.supplierId = contact.supplierId;

      await prisma.contact.updateMany({
        where: { ...where, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }
    data.isPrimary = input.isPrimary;
  }

  return prisma.contact.update({
    where: { id },
    data,
    select: contactWithRelationsSelect,
  });
}

export async function deleteContact(id: string) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) {
    throw new AppError(404, '联系人不存在', 'CONTACT_NOT_FOUND');
  }

  await prisma.contact.delete({ where: { id } });
  return { id };
}

export async function setPrimaryContact(id: string) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) {
    throw new AppError(404, '联系人不存在', 'CONTACT_NOT_FOUND');
  }

  const where: any = {};
  if (contact.customerId) where.customerId = contact.customerId;
  if (contact.supplierId) where.supplierId = contact.supplierId;

  // 先取消所有主要联系人
  await prisma.contact.updateMany({
    where: { ...where, isPrimary: true },
    data: { isPrimary: false },
  });

  // 设置当前联系人为主要
  return prisma.contact.update({
    where: { id },
    data: { isPrimary: true },
    select: contactWithRelationsSelect,
  });
}