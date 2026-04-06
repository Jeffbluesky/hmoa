import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import dictionaryTypeRoutes from './dictionary-types.js';
import dictionaryRoutes from './dictionaries.js';
import materialRoutes from './materials.js';
import productRoutes from './products.js';
import uploadRoutes from './upload.js';
import customerRoutes from './customers.js';
import supplierRoutes from './suppliers.js';
import contactRoutes from './contacts.js';
import catalogTemplateRoutes from './catalog-templates.js';
import catalogCoverRoutes from './catalog-covers.js';
import catalogRoutes from './catalogs.js';
import { createResponse } from '../utils/response.js';

const router: ReturnType<typeof Router> = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json(
    createResponse(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      'OK'
    )
  );
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dictionary-types', dictionaryTypeRoutes);
router.use('/dictionaries', dictionaryRoutes);
router.use('/materials', materialRoutes);
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/contacts', contactRoutes);
router.use('/catalog-templates', catalogTemplateRoutes);
router.use('/catalog-covers', catalogCoverRoutes);
router.use('/catalogs', catalogRoutes);

export default router;
