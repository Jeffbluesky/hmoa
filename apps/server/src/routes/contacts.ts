import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '../middleware/index.js';
import * as contactService from '../services/contactService.js';
import { createContactSchema, updateContactSchema, uuidParamSchema } from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

const router: ReturnType<typeof Router> = Router();

// GET /api/contacts
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { contacts, total } = await contactService.getContacts(pagination, keyword);
    res.json(createPaginatedResponse(contacts, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/contacts/by-customer/:customerId
router.get(
  '/by-customer/:customerId',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await contactService.getContactsByCustomerId(req.params.customerId);
    res.json(createResponse(data));
  })
);


// GET /api/contacts/by-supplier/:supplierId
router.get(
  '/by-supplier/:supplierId',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await contactService.getContactsBySupplierId(req.params.supplierId);
    res.json(createResponse(data));
  })
);

// GET /api/contacts/:id
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await contactService.getContactById(req.params.id);
    if (!data) {
      res.status(404).json(createResponse(null, '联系人不存在', 404));
      return;
    }
    res.json(createResponse(data));
  })
);

// POST /api/contacts
router.post(
  '/',
  validateBody(createContactSchema),
  asyncHandler(async (req, res) => {
    const data = await contactService.createContact(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/contacts/:id
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateContactSchema),
  asyncHandler(async (req, res) => {
    const data = await contactService.updateContact(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/contacts/:id
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await contactService.deleteContact(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

// POST /api/contacts/:id/set-primary - 设置为主要联系人
router.post(
  '/:id/set-primary',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await contactService.setPrimaryContact(req.params.id);
    res.json(createResponse(data, '设置成功'));
  })
);

export default router;