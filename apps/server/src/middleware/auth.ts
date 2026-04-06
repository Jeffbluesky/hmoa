import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AppError } from './errorHandler.js';
import type { UserRole } from '@hmoa/types';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.clearCookie('token', {
        domain: config.cookie.domain,
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite as 'strict' | 'lax' | 'none',
      });
      return next(new AppError(401, 'Invalid or expired token', 'TOKEN_INVALID'));
    }
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }

    next();
  };
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const setTokenCookie = (res: Response, token: string) => {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  res.cookie('token', token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite as 'strict' | 'lax' | 'none',
    domain: config.cookie.domain,
    maxAge,
    path: '/',
  });
};

export const clearTokenCookie = (res: Response) => {
  res.clearCookie('token', {
    domain: config.cookie.domain,
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite as 'strict' | 'lax' | 'none',
    path: '/',
  });
};
