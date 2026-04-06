import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { UserRole } from '@hmoa/types';
import type { PaginationResult } from '../utils/pagination.js';

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

const userSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getUsers(pagination: PaginationResult, keyword?: string) {
  const where = keyword
    ? {
        OR: [
          { username: { contains: keyword } },
          { email: { contains: keyword } },
        ],
      }
    : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function createUser(input: CreateUserInput) {
  const existingUsername = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (existingUsername) {
    throw new AppError(409, '同名用户已经存在', 'USER_EXISTS');
  }

  if (input.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new AppError(409, '邮箱已被使用', 'EMAIL_EXISTS');
    }
  }

  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash(input.password, 12);

  return prisma.user.create({
    data: {
      username: input.username,
      email: input.email || null,
      password: hashedPassword,
      role: input.role,
      isActive: input.isActive ?? true,
    },
    select: userSelect,
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
  }

  if (input.email && input.email !== user.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new AppError(409, '邮箱已被使用', 'EMAIL_EXISTS');
    }
  }

  const data: UpdateUserInput = { ...input };
  if (input.email === '') {
    data.email = undefined;
  }

  if (input.password) {
    const bcrypt = await import('bcryptjs');
    (data as any).password = await bcrypt.default.hash(input.password, 12);
  }

  return prisma.user.update({
    where: { id },
    data: data as any,
    select: userSelect,
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
  }

  await prisma.user.delete({ where: { id } });
  return { id };
}
