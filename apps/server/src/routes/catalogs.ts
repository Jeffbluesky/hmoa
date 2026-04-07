import { Router } from 'express';
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/index.js';
import * as catalogService from '../services/catalogService.js';
import * as pdfGenerationService from '../services/pdfGenerationService.js';
import {
  createCatalogSchema,
  updateCatalogSchema,
  uuidParamSchema,
  paginationSchema,
  keywordSchema,
} from '@hmoa/utils';
import { createResponse, createPaginatedResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router: ReturnType<typeof Router> = Router();

// GET /api/catalogs
router.get('/', validateQuery(paginationSchema), validateQuery(keywordSchema),
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    const { data, total } = await catalogService.getCatalogs(pagination, keyword);
    res.json(createPaginatedResponse(data, total, pagination.page, pagination.pageSize));
  })
);

// GET /api/catalogs/:id
router.get('/:id', validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogService.getCatalogById(req.params.id);
    if (!data) { res.status(404).json(createResponse(null, '目录不存在', 404)); return; }
    res.json(createResponse(data));
  })
);

// POST /api/catalogs
router.post('/', validateBody(createCatalogSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogService.createCatalog(req.body);
    res.status(201).json(createResponse(data, '创建成功', 201));
  })
);

// PUT /api/catalogs/:id
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateCatalogSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogService.updateCatalog(req.params.id, req.body);
    res.json(createResponse(data, '更新成功'));
  })
);

// DELETE /api/catalogs/:id
router.delete('/:id', validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    await catalogService.deleteCatalog(req.params.id);
    res.json(createResponse({ id: req.params.id }, '删除成功'));
  })
);

// GET /api/catalogs/:id/status
router.get('/:id/status', validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const data = await catalogService.getCatalogStatus(req.params.id);
    res.json(createResponse(data));
  })
);

// POST /api/catalogs/:id/generate
router.post('/:id/generate', validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const catalogId = req.params.id;
    const catalog = await catalogService.getCatalogById(catalogId);
    if (!catalog) { res.status(404).json(createResponse(null, '目录不存在', 404)); return; }
    if (catalog.status === 'generating') {
      res.status(409).json(createResponse(null, '目录正在生成中，请稍后', 409));
      return;
    }

    await catalogService.updateCatalog(catalogId, { status: 'generating' });

    // 异步生成
    setTimeout(async () => {
      try {
        const products = await catalogService.getCatalogProducts(catalogId);
        const result = await pdfGenerationService.generateCatalogPdf({
          catalogId,
          template: catalog.template as any,
          frontCover: catalog.frontCover as any,
          backCover: catalog.backCover as any,
          products,
        });

        await catalogService.updateCatalog(catalogId, {
          status: 'completed',
          pdfUrl: `/api/catalogs/${catalogId}/download`,
          pdfPath: result.pdfPath,
          pdfSize: result.fileSize,
          pageCount: result.pageCount,
          generatedAt: new Date(),
          error: null,
        });
      } catch (error) {
        await catalogService.updateCatalog(catalogId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'PDF生成失败',
        });
      }
    }, 100);

    res.json(createResponse({ catalogId, status: 'generating' }, 'PDF生成任务已开始'));
  })
);

// GET /api/catalogs/:id/download
router.get('/:id/download', validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const catalog = await catalogService.getCatalogById(req.params.id);
    if (!catalog) { res.status(404).json(createResponse(null, '目录不存在', 404)); return; }
    if (catalog.status !== 'completed') {
      res.status(400).json(createResponse(null, 'PDF尚未生成', 400));
      return;
    }

    const pdfPath = (catalog as any).pdfPath;
    if (!pdfPath) { res.status(404).json(createResponse(null, 'PDF文件路径不存在', 404)); return; }

    try {
      await fs.access(pdfPath);
      const filename = `${catalog.name || 'catalog'}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      const fileBuffer = await fs.readFile(pdfPath);
      res.send(fileBuffer);
    } catch {
      res.status(404).json(createResponse(null, 'PDF文件不存在，请重新生成', 404));
    }
  })
);

export default router;
