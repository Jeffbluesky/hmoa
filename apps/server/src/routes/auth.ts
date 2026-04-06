import { Router } from 'express';
import {
  authenticate,
  validateBody,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
} from '../middleware/index.js';
import * as authService from '../services/authService.js';
import { loginSchema, createUserSchema } from '@hmoa/utils';
import { createResponse } from '../utils/response.js';

const router: ReturnType<typeof Router> = Router();

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const user = await authService.login(req.body);
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    setTokenCookie(res, token);
    res.json(createResponse({ user }, '登录成功'));
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register
router.post('/register', validateBody(createUserSchema), async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(createResponse({ user }, '注册成功', 201));
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  clearTokenCookie(res);
  res.json(createResponse(null, '退出成功'));
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json(createResponse(null, '用户不存在', 404));
      return;
    }
    res.json(createResponse({ user }, '获取成功'));
  } catch (error) {
    next(error);
  }
});

export default router;
