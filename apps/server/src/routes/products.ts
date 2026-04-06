import { Router } from 'express';
import {
  asyncHandler,
  validateBody,
  validateParams,
} from '../middleware/index.js';
import * as productService from '../services/productService.js';
import { createProductSchema, updateProductSchema, uuidParamSchema } from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/products
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { data, total } = await productService.getProducts(pagination, keyword);
    res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/products/all - 无分页，用于 BOM 下拉选项
router.get('/all', asyncHandler(async (_req, res) => {
  const data = await productService.getAllProducts();
  res.json(createResponse(data));
}));

// GET /api/products/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await productService.getProductById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '产品不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/products
router.post(
  '/',
  validateBody(createProductSchema),
  asyncHandler(async (req, res) => {
    const data = await productService.createProduct(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/products/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateProductSchema),
  asyncHandler(async (req, res) => {
    const data = await productService.updateProduct(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/products/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

export default router;
