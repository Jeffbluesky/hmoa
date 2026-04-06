import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '../middleware/index.js';
import * as supplierService from '../services/supplierService.js';
import { createSupplierSchema, updateSupplierSchema, uuidParamSchema } from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/suppliers
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { suppliers, total } = await supplierService.getSuppliers(pagination, keyword);
    res.json(createPaginatedResponse(suppliers, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/suppliers/all - 无分页，用于前端下拉选项
router.get('/all', asyncHandler(async (_req, res) => {
  const data = await supplierService.getAllSuppliers();
  res.json(createResponse(data));
}));

// GET /api/suppliers/cities - 分页获取去重后的城市列表
router.get('/cities', asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
  const { data, total } = await supplierService.getSupplierCities(pagination, keyword);
  res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
}));

// GET /api/suppliers/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await supplierService.getSupplierById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '供应商不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/suppliers
router.post(
  '/',
  validateBody(createSupplierSchema),
  asyncHandler(async (req, res) => {
    const data = await supplierService.createSupplier(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/suppliers/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateSupplierSchema),
  asyncHandler(async (req, res) => {
    const data = await supplierService.updateSupplier(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/suppliers/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await supplierService.deleteSupplier(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

export default router;