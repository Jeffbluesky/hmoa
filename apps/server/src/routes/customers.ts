import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '../middleware/index.js';
import * as customerService from '../services/customerService.js';
import { createCustomerSchema, updateCustomerSchema, uuidParamSchema } from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/customers
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { customers, total } = await customerService.getCustomers(pagination, keyword);
    res.json(createPaginatedResponse(customers, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/customers/all - 无分页，用于前端下拉选项
router.get('/all', asyncHandler(async (_req, res) => {
  const data = await customerService.getAllCustomers();
  res.json(createResponse(data));
}));

// GET /api/customers/countries - 分页获取去重后的国家列表
router.get('/countries', asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
  const { data, total } = await customerService.getCustomerCountries(pagination, keyword);
  res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
}));


// GET /api/customers/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await customerService.getCustomerById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '客户不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/customers
router.post(
  '/',
  validateBody(createCustomerSchema),
  asyncHandler(async (req, res) => {
    const data = await customerService.createCustomer(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/customers/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateCustomerSchema),
  asyncHandler(async (req, res) => {
    const data = await customerService.updateCustomer(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/customers/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await customerService.deleteCustomer(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

export default router;