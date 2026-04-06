import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '../middleware/index.js';
import * as materialService from '../services/materialService.js';
import { createMaterialSchema, updateMaterialSchema, uuidParamSchema } from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/materials
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { data, total } = await materialService.getMaterials(pagination, keyword);
    res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/materials/all - 无分页，用于前端下拉选项
router.get('/all', asyncHandler(async (_req, res) => {
  const data = await materialService.getAllMaterials();
  res.json(createResponse(data));
}));

// GET /api/materials/names - 分页获取去重后的材料名称
router.get(
  '/names',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { data, total } = await materialService.getMaterialNames(pagination, keyword);
    res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/materials/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await materialService.getMaterialById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '材料不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/materials
router.post(
  '/',
  validateBody(createMaterialSchema),
  asyncHandler(async (req, res) => {
    const data = await materialService.createMaterial(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/materials/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateMaterialSchema),
  asyncHandler(async (req, res) => {
    const data = await materialService.updateMaterial(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/materials/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await materialService.deleteMaterial(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

export default router;
