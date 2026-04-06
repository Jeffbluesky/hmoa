import { Router } from 'express';
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/index.js';
import * as catalogTemplateService from '../services/catalogTemplateService.js';
import {
  createCatalogTemplateSchema,
  updateCatalogTemplateSchema,
  uuidParamSchema,
  paginationSchema,
  keywordSchema,
} from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/catalog-templates
router.get(
  '/',
  validateQuery(paginationSchema),
  validateQuery(keywordSchema),
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { data, total } = await catalogTemplateService.getCatalogTemplates(pagination, keyword);
    res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/catalog-templates/all - 无分页，用于下拉选项
router.get('/all', asyncHandler(async (_req, res) => {
  const data = await catalogTemplateService.getAllCatalogTemplates();
  res.json(createResponse(data));
}));

// GET /api/catalog-templates/available-fields - 获取可用产品字段
router.get('/available-fields', asyncHandler(async (_req, res) => {
  const data = await catalogTemplateService.getAvailableProductFields();
  res.json(createResponse(data));
}));

// GET /api/catalog-templates/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogTemplateService.getCatalogTemplateById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '模板不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/catalog-templates
router.post(
  '/',
  validateBody(createCatalogTemplateSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogTemplateService.createCatalogTemplate(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/catalog-templates/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateCatalogTemplateSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogTemplateService.updateCatalogTemplate(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/catalog-templates/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await catalogTemplateService.deleteCatalogTemplate(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

export default router;