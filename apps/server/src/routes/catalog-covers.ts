import { Router } from 'express';
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/index.js';
import * as catalogCoverService from '../services/catalogCoverService.js';
import {
  createCatalogCoverSchema,
  updateCatalogCoverSchema,
  uuidParamSchema,
  paginationSchema,
} from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/catalog-covers
router.get(
  '/',
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const { data, total } = await catalogCoverService.getCatalogCovers(pagination, type);
    res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/catalog-covers/all - 无分页，用于下拉选项
router.get('/all', asyncHandler(async (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type as 'front' | 'back' : undefined;
  const data = await catalogCoverService.getAllCatalogCovers(type);
  res.json(createResponse(data));
}));

// GET /api/catalog-covers/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogCoverService.getCatalogCoverById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '封面不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/catalog-covers
router.post(
  '/',
  validateBody(createCatalogCoverSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogCoverService.createCatalogCover(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/catalog-covers/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateCatalogCoverSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogCoverService.updateCatalogCover(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/catalog-covers/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await catalogCoverService.deleteCatalogCover(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

export default router;