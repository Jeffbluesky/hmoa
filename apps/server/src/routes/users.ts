import { Router } from 'express';
import {
  authenticate,
  authorize,
  asyncHandler,
  validateBody,
  validateParams,
} from '../middleware/index.js';
import * as userService from '../services/userService.js';
import { createUserSchema, updateUserSchema, uuidParamSchema } from '@hmoa/utils';
import { UserRole } from '@hmoa/types';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.js';

const router: ReturnType<typeof Router> = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { users, total } = await userService.getUsers(pagination, keyword);
    res.json(createPaginatedResponse(users, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/users/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    if (req.user?.role === UserRole.EDITOR && req.user.userId !== req.params.id) {
      throw new AppError(403, '权限不足', 'FORBIDDEN');
    }
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json(createResponse(null, '用户不存在', 404));
      return;
    }
    res.json(createResponse(user));
  })
);

// POST /api/users
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(createResponse(user, '创建成功', 201));
  })
);

// PUT /api/users/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    if (req.user?.role === UserRole.EDITOR && req.user.userId !== req.params.id) {
      throw new AppError(403, '权限不足', 'FORBIDDEN');
    }
    if (req.body.role && req.user?.role !== UserRole.SUPER_ADMIN) {
      delete req.body.role;
    }
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(createResponse(user, '更新成功'));
  })
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    if (req.user?.userId === req.params.id) {
      throw new AppError(400, '不能删除自己', 'CANNOT_DELETE_SELF');
    }
    await userService.deleteUser(req.params.id);
    res.json(createResponse(null, '删除成功'));
  })
);

export default router;
