import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code || err.statusCode,
      message: err.message,
      data: null,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 400,
      message: 'Validation error',
      data: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    data: null,
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'Resource not found',
    data: null,
  });
};
