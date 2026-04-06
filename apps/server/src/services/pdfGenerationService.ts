import { AppError } from '../middleware/errorHandler.js';
import type { CatalogTemplate, CatalogCover, Product } from '@hmoa/types';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDF 生成配置
const PDF_CONFIG = {
  outputDir: path.join(__dirname, '../../uploads/catalogs'),
  tempDir: path.join(__dirname, '../../temp'),
  defaultOptions: {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
  },
};

// 确保目录存在
async function ensureDirectories() {
  await fs.mkdir(PDF_CONFIG.outputDir, { recursive: true });
  await fs.mkdir(PDF_CONFIG.tempDir, { recursive: true });
}

export interface PdfGenerationOptions {
  catalogId: string;
  template: CatalogTemplate;
  frontCover?: CatalogCover | null;
  backCover?: CatalogCover | null;
  products: Product[];
}

/**
 * 生成目录PDF
 */
export async function generateCatalogPdf(options: PdfGenerationOptions): Promise<{
  pdfPath: string;
  pageCount: number;
  fileSize: number;
}> {
  await ensureDirectories();

  const { catalogId, template, products } = options;
  // frontCover和backCover参数保留供未来使用
  // const { frontCover, backCover } = options;
  const timestamp = Date.now();
  const filename = `catalog_${catalogId}_${timestamp}.pdf`;
  const pdfPath = path.join(PDF_CONFIG.outputDir, filename);

  try {
    // TODO: 实现PDF生成逻辑
    // 1. 根据模板配置生成HTML
    // 2. 使用puppeteer将HTML转为PDF
    // 3. 添加封面封底
    // 4. 保存文件

    // 临时模拟实现
    await fs.writeFile(pdfPath, 'PDF content placeholder');

    const stats = await fs.stat(pdfPath);
    return {
      pdfPath,
      pageCount: Math.ceil(products.length / (template.config as any).itemsPerPage || 6),
      fileSize: stats.size,
    };
  } catch (error) {
    // 清理可能创建的部分文件
    try {
      await fs.unlink(pdfPath);
    } catch (e) {
      // 忽略清理错误
    }
    throw new AppError(500, `PDF生成失败: ${error instanceof Error ? error.message : '未知错误'}`, 'PDF_GENERATION_FAILED');
  }
}

/**
 * 生成HTML模板（TODO: 实现具体模板渲染）
 */
export function generateHtmlFromTemplate(
  template: CatalogTemplate,
  products: Product[]
): string {
  const config = template.config as any;
  const { columns, fields, styles } = config;

  // 简单HTML模板示例
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>产品目录</title>
        <style>
          body {
            margin: 0;
            padding: ${styles.padding}px;
            background-color: ${styles.backgroundColor};
            font-family: Arial, sans-serif;
          }
          .page {
            page-break-after: always;
            padding: ${styles.margin}mm;
          }
          .product-grid {
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: ${styles.spacing}px;
          }
          .product-item {
            border: 1px solid ${styles.borderColor};
            padding: 10px;
            background: white;
          }
          .product-title {
            font-size: ${styles.titleFontSize}px;
            font-weight: ${styles.titleFontWeight};
            color: ${styles.titleColor};
            margin-bottom: 8px;
          }
          .product-field {
            font-size: ${styles.fieldFontSize}px;
            color: ${styles.fieldColor};
            margin: 4px 0;
          }
          @media print {
            .page {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="product-grid">
            ${products.map(product => `
              <div class="product-item">
                ${fields.filter((f: any) => f.visible).map((field: any) => `
                  <div class="product-field" style="${field.style ? `text-align: ${field.style.align || 'left'};` : ''}">
                    ${field.label}: ${getProductFieldValue(product, field.productField)}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * 获取产品字段值
 */
function getProductFieldValue(product: any, fieldName: string): string {
  const value = product[fieldName];
  if (value === null || value === undefined) return '-';

  if (fieldName === 'category' && product.category) {
    return product.category.name;
  }
  if (fieldName === 'colorDict' && product.colorDict) {
    return product.colorDict.name;
  }
  if (fieldName === 'mainImage') {
    const images = product.images ? JSON.parse(product.images) : [];
    return images[0] || '-';
  }
  if (fieldName === 'images') {
    const images = product.images ? JSON.parse(product.images) : [];
    return images.join(', ');
  }

  return String(value);
}

/**
 * 清理旧PDF文件
 */
export async function cleanupOldPdfFiles(maxAgeHours = 24): Promise<void> {
  await ensureDirectories();
  const files = await fs.readdir(PDF_CONFIG.outputDir);
  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(PDF_CONFIG.outputDir, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath);
        }
      } catch (error) {
        // 忽略错误，继续清理其他文件
      }
    }
  }
}