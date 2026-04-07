import { AppError } from '../middleware/errorHandler.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_CONFIG = {
  outputDir: path.join(__dirname, '../../uploads/catalogs'),
};

async function ensureDirectories() {
  await fs.mkdir(PDF_CONFIG.outputDir, { recursive: true });
}

export interface TemplateField {
  key: string;
  label: string;
  visible: boolean;
  bold: boolean;
}

export interface TemplateConfig {
  layout: 'single' | 'double' | 'quad';
  showImage: boolean;
  imagePosition: 'top' | 'left';
  fields: TemplateField[];
  styles: {
    primaryColor: string;
    fontFamily: string;
    titleFontSize: number;
    fieldFontSize: number;
    showBorder: boolean;
    backgroundColor: string;
  };
}

export interface PdfGenerationOptions {
  catalogId: string;
  template: { config: unknown; pageSize: string; orientation: string };
  frontCover?: { url: string } | null;
  backCover?: { url: string } | null;
  products: any[];
}

function getProductFieldValue(product: any, key: string): string {
  if (key === 'mainImage') {
    try {
      const imgs = product.images ? JSON.parse(product.images) : [];
      return imgs[0] || '';
    } catch { return ''; }
  }
  if (key === 'category') return product.category?.name || '';
  if (key === 'colorDict') return product.colorDict?.name || '';
  const v = product[key];
  return v == null ? '' : String(v);
}

function buildProductCard(product: any, config: TemplateConfig, imageWidth: string): string {
  const { styles, fields, showImage, imagePosition } = config;
  const visibleFields = fields.filter(f => f.visible);
  const border = styles.showBorder ? `border: 1px solid #e0e0e0;` : '';
  const imageUrl = showImage ? getProductFieldValue(product, 'mainImage') : '';

  const fieldsHtml = visibleFields.map(f => {
    const val = getProductFieldValue(product, f.key);
    if (f.key === 'mainImage') return '';
    return `<div style="font-size:${styles.fieldFontSize}px;margin:3px 0;${f.bold ? 'font-weight:bold;' : ''}color:#333;">
      <span style="color:#888;font-size:${styles.fieldFontSize - 1}px;">${f.label}：</span>${val || '-'}
    </div>`;
  }).join('');

  const imgHtml = imageUrl
    ? `<img src="${imageUrl}" style="width:${imageWidth};height:auto;max-height:200px;object-fit:contain;display:block;margin:0 auto 8px;" />`
    : `<div style="width:${imageWidth};height:120px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;margin-bottom:8px;">无图片</div>`;

  if (showImage && imagePosition === 'left') {
    return `<div style="display:flex;gap:12px;padding:12px;${border}background:${styles.backgroundColor};border-radius:4px;height:100%;box-sizing:border-box;">
      <div style="flex-shrink:0;">${imgHtml}</div>
      <div style="flex:1;overflow:hidden;">${fieldsHtml}</div>
    </div>`;
  }

  return `<div style="padding:12px;${border}background:${styles.backgroundColor};border-radius:4px;height:100%;box-sizing:border-box;">
    ${showImage ? imgHtml : ''}
    ${fieldsHtml}
  </div>`;
}

function buildContentPages(products: any[], config: TemplateConfig): string {
  const layoutMap = { single: 1, double: 2, quad: 4 };
  const itemsPerPage = layoutMap[config.layout] || 2;
  const columns = config.layout === 'quad' ? 2 : config.layout === 'double' ? 2 : 1;
  const imageWidth = config.layout === 'single' ? '60%' : '100%';

  let pages = '';
  for (let i = 0; i < products.length; i += itemsPerPage) {
    const chunk = products.slice(i, i + itemsPerPage);
    const cards = chunk.map(p => `
      <div style="flex:1;min-width:0;">
        ${buildProductCard(p, config, imageWidth)}
      </div>`).join('');

    pages += `<div class="page" style="
      width:210mm;min-height:297mm;padding:15mm;box-sizing:border-box;
      page-break-after:always;background:white;
      display:flex;flex-direction:column;
    ">
      <div style="display:flex;gap:12px;flex-wrap:wrap;flex:1;">
        ${cards}
      </div>
      <div style="text-align:center;font-size:10px;color:#aaa;margin-top:8mm;">${i / itemsPerPage + 1}</div>
    </div>`;
  }
  return pages;
}

function buildCoverPage(imageUrl: string): string {
  return `<div class="page" style="
    width:210mm;min-height:297mm;padding:0;box-sizing:border-box;
    page-break-after:always;background:#000;
    display:flex;align-items:center;justify-content:center;overflow:hidden;
  ">
    <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
  </div>`;
}

export function generateHtmlFromTemplate(
  template: { config: unknown; pageSize: string; orientation: string },
  products: any[],
  frontCoverUrl?: string,
  backCoverUrl?: string,
): string {
  const config = template.config as TemplateConfig;

  const pages = [
    frontCoverUrl ? buildCoverPage(frontCoverUrl) : '',
    buildContentPages(products, config),
    backCoverUrl ? buildCoverPage(backCoverUrl) : '',
  ].join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${(config.styles?.fontFamily) || 'Arial, sans-serif'}; background: #fff; }
    @page { size: ${template.pageSize || 'A4'} ${template.orientation || 'portrait'}; margin: 0; }
    @media print { .page { page-break-after: always; } }
  </style>
</head>
<body>${pages}</body>
</html>`;
}

export async function generateCatalogPdf(options: PdfGenerationOptions): Promise<{
  pdfPath: string;
  pageCount: number;
  fileSize: number;
}> {
  await ensureDirectories();

  const { catalogId, template, frontCover, backCover, products } = options;
  const timestamp = Date.now();
  const filename = `catalog_${catalogId}_${timestamp}.pdf`;
  const pdfPath = path.join(PDF_CONFIG.outputDir, filename);

  let browser: any = null;
  try {
    const puppeteer = await import('puppeteer');
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    const html = generateHtmlFromTemplate(
      template,
      products,
      frontCover?.url,
      backCover?.url,
    );

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: (template.pageSize as any) || 'A4',
      landscape: template.orientation === 'landscape',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const stats = await fs.stat(pdfPath);
    const config = template.config as TemplateConfig;
    const layoutMap: Record<string, number> = { single: 1, double: 2, quad: 4 };
    const itemsPerPage = layoutMap[config?.layout] || 2;
    const contentPages = Math.ceil(products.length / itemsPerPage);
    const pageCount = contentPages + (frontCover ? 1 : 0) + (backCover ? 1 : 0);

    return { pdfPath, pageCount, fileSize: stats.size };
  } catch (error) {
    try { await fs.unlink(pdfPath); } catch { /* ignore */ }
    throw new AppError(500, `PDF生成失败: ${error instanceof Error ? error.message : '未知错误'}`, 'PDF_GENERATION_FAILED');
  } finally {
    if (browser) await browser.close();
  }
}

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
        if (now - stats.mtimeMs > maxAgeMs) await fs.unlink(filePath);
      } catch { /* ignore */ }
    }
  }
}
