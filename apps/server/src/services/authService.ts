import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { UserWithoutPassword, UserRole } from '@hmoa/types';

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

const SALT_ROUNDS = 12;

export async function register(input: RegisterInput): Promise<UserWithoutPassword> {
  // 检查用户名唯一性
  const existingUsername = await prisma.user.findUnique({
    where: { username: input.username },
  });

  if (existingUsername) {
    throw new AppError(409, 'Username already exists', 'USER_EXISTS');
  }

  // 如果提供了邮箱，检查唯一性
  if (input.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS');
    }
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email || null,
      password: hashedPassword,
      role: input.role || 'EDITOR',
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as UserWithoutPassword;
}

export async function login(input: LoginInput): Promise<UserWithoutPassword> {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Account is disabled', 'ACCOUNT_DISABLED');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as UserWithoutPassword;
}

export async function getUserById(id: string): Promise<UserWithoutPassword | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as UserWithoutPassword;
}
