import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '../middleware/index.js';
import * as dictionaryService from '../services/dictionaryService.js';
import { createDictionarySchema, updateDictionarySchema, uuidParamSchema } from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/dictionaries
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const typeId = typeof req.query.typeId === 'string' ? req.query.typeId : undefined;
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { data, total } = await dictionaryService.getDictionaries(pagination, typeId, keyword);
    res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/dictionaries/by-type-code/:code
router.get(
  '/by-type-code/:code',
  asyncHandler(async (req, res) => {
    const data = await dictionaryService.getDictionariesByTypeCode(req.params.code);
    res.json(createResponse(data));
  })
);

// GET /api/dictionaries/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await dictionaryService.getDictionaryById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '字典项不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/dictionaries
router.post(
  '/',
  validateBody(createDictionarySchema),
  asyncHandler(async (req, res) => {
    const data = await dictionaryService.createDictionary(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/dictionaries/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateDictionarySchema),
  asyncHandler(async (req, res) => {
    const data = await dictionaryService.updateDictionary(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/dictionaries/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await dictionaryService.deleteDictionary(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

export default router;
