import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '../middleware/index.js';
import * as dictionaryTypeService from '../services/dictionaryTypeService.js';
import { createDictionaryTypeSchema, updateDictionaryTypeSchema, uuidParamSchema } from '@hmoa/utils';
import { createResponse } from '../utils/response.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/dictionary-types
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await dictionaryTypeService.getDictionaryTypes();
    res.json(createResponse(data));
  })
);

// GET /api/dictionary-types/active
router.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const data = await dictionaryTypeService.getDictionaryTypesActive();
    res.json(createResponse(data));
  })
);

// GET /api/dictionary-types/by-code/:code
router.get(
  '/by-code/:code',
  asyncHandler(async (req, res) => {
    const data = await dictionaryTypeService.getDictionaryTypeByCode(req.params.code);
    if (!data) {
      res.status(404).json(createResponse(null, '字典类型不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// GET /api/dictionary-types/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await dictionaryTypeService.getDictionaryTypeById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '字典类型不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/dictionary-types
router.post(
  '/',
  validateBody(createDictionaryTypeSchema),
  asyncHandler(async (req, res) => {
    const data = await dictionaryTypeService.createDictionaryType(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/dictionary-types/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateDictionaryTypeSchema),
  asyncHandler(async (req, res) => {
    const data = await dictionaryTypeService.updateDictionaryType(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/dictionary-types/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await dictionaryTypeService.deleteDictionaryType(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

// POST /api/dictionary-types/reorder
router.post(
  '/reorder',
  asyncHandler(async (_req, res) => {
    const result = await dictionaryTypeService.reorderDictionaryTypes();
    res.json(createResponse(result, '重排成功'));
  })
);

export default router;
