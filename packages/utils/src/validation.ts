import { z } from 'zod';

// ==========================
// 通用辅助
// ==========================
export const emptyStringToNull = z.literal('').transform(() => null);
export const optionalString = z.preprocess((val) => (val === '' ? null : val), z.string().max(500).nullish());
export const optionalUuid = z.preprocess((val) => (val === '' ? null : val), z.string().uuid().nullish());

// ==========================
// 分页
// ==========================
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const keywordSchema = z.object({
  keyword: z.string().optional(),
});

// ==========================
// 用户
// ==========================
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ==========================
// 字典类型
// ==========================
export const createDictionaryTypeSchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().min(1).max(100),
  sortOrder: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const updateDictionaryTypeSchema = createDictionaryTypeSchema.partial();

// ==========================
// 字典项
// ==========================
// 字典项可选字符串：空字符串会被转为 null，同时兼容 null / undefined
const dictOptionalString = (max: number) =>
  z.preprocess((val) => (val === '' ? null : val), z.string().max(max).nullish());

export const createDictionarySchema = z.object({
  code: z.string().max(50).optional(),
  name: z.string().min(1).max(100),
  en: dictOptionalString(200),
  jp: dictOptionalString(200),
  symbol: dictOptionalString(200),
  other: dictOptionalString(500),
  typeId: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const updateDictionarySchema = createDictionarySchema.partial();

// ==========================
// 基础材料
// ==========================
export const createMaterialSchema = z.object({
  name: z.string().min(1).max(200),
  specification: z.string().min(1).max(500),
  color: z.string().max(200).optional().or(emptyStringToNull),
  colorCode: z.string().max(200).optional().or(emptyStringToNull),
  unitId: z.string().uuid(),
  remark: z.string().max(1000).optional().or(emptyStringToNull),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// ==========================
// 产品 BOM 子项
// ==========================
export const productBOMItemSchema = z
  .object({
    materialId: optionalUuid,
    childProductId: optionalUuid,
    quantity: z.coerce.number().min(0.01, '用量必须大于0'),
    remark: optionalString,
  })
  .refine((data) => data.materialId || data.childProductId, {
    message: 'BOM 行必须选择材料或子产品其一',
    path: ['materialId'],
  })
  .refine((data) => !(data.materialId && data.childProductId), {
    message: 'BOM 行不能同时选择材料和子产品',
    path: ['materialId'],
  });

// ==========================
// 产品
// ==========================
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  itemNo: z.string().min(1).max(200),
  length: optionalString,
  width: optionalString,
  height: optionalString,
  seatH: optionalString,
  color: optionalString,
  colorCode: optionalString,
  categoryId: z.string().uuid(),
  colorDictId: z.string().uuid(),
  materialId: optionalUuid,
  remark: optionalString,
  images: z.array(z.string().min(1)).min(1, '请至少上传一张产品图片'),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().min(1),
      })
    )
    .optional(),
  boms: z.array(productBOMItemSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  itemNo: z.string().min(1).max(200).optional(),
  length: optionalString,
  width: optionalString,
  height: optionalString,
  seatH: optionalString,
  color: optionalString,
  colorCode: optionalString,
  categoryId: z.string().uuid().optional(),
  colorDictId: z.string().uuid().optional(),
  materialId: optionalUuid,
  remark: optionalString,
  images: z.array(z.string().min(1)).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().min(1),
      })
    )
    .optional(),
  boms: z.array(productBOMItemSchema).optional(),
});

// ==========================
// 路由参数
// ==========================
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID 格式不正确'),
});

// ==========================
// CRM 验证
// ==========================

// 内联联系人（嵌套在客户/供应商中）
export const inlineContactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, '联系人姓名不能为空').max(100),
  position: optionalString,
  phone: optionalString,
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')).or(z.null()),
  isPrimary: z.boolean().optional().default(false),
});

// 客户
export const createCustomerSchema = z.object({
  name: z.string().min(1, '客户名称不能为空').max(200),
  shortName: optionalString,
  typeId: optionalUuid,
  country: optionalString,
  address: optionalString,
  remark: optionalString,
  isActive: z.boolean().optional().default(true),
  finalCustomerId: optionalUuid,
  contacts: z.array(inlineContactSchema).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();


// 供应商
export const createSupplierSchema = z.object({
  name: z.string().min(1, '供应商名称不能为空').max(200),
  shortName: optionalString,
  city: optionalString,
  typeId: optionalUuid,
  address: optionalString,
  remark: optionalString,
  isActive: z.boolean().optional().default(true),
  contacts: z.array(inlineContactSchema).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// 联系人
const contactBaseSchema = z.object({
  customerId: optionalUuid,
  supplierId: optionalUuid,
  name: z.string().min(1, '联系人姓名不能为空').max(100),
  phone: optionalString,
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  position: optionalString,
  isPrimary: z.boolean().optional().default(false),
  remark: optionalString,
});

export const createContactSchema = contactBaseSchema.refine(
  (data) => data.customerId || data.supplierId,
  { message: '联系人必须关联客户或供应商之一', path: ['customerId'] }
);

export const updateContactSchema = contactBaseSchema.partial();

// ==========================
// 目录册验证
// ==========================

// 模板字段配置
export const templateFieldSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['text', 'image', 'dimension', 'color', 'code']),
  productField: z.enum([
    'name', 'itemNo', 'code', 'internalCode', 'length', 'width', 'height',
    'seatH', 'color', 'colorCode', 'category', 'colorDict', 'mainImage',
    'images', 'remark'
  ]),
  label: z.string().min(1, '字段标签不能为空'),
  visible: z.boolean().default(true),
  order: z.coerce.number().int().min(0),
  width: z.string().optional(),
  style: z.object({
    fontSize: z.number().optional(),
    fontWeight: z.string().optional(),
    color: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
  }).optional(),
});

// 模板样式配置
export const templateStylesSchema = z.object({
  titleFontSize: z.number().min(8).max(72).default(16),
  titleFontWeight: z.string().default('bold'),
  titleColor: z.string().default('#000000'),
  fieldFontSize: z.number().min(8).max(72).default(12),
  fieldColor: z.string().default('#333333'),
  backgroundColor: z.string().default('#FFFFFF'),
  borderColor: z.string().default('#E0E0E0'),
  padding: z.number().min(0).default(10),
  spacing: z.number().min(0).default(8),
});

// 模板配置
export const templateConfigSchema = z.object({
  layout: z.enum(['grid', 'list', 'mixed']).default('grid'),
  itemsPerPage: z.number().int().positive().default(6),
  columns: z.number().int().min(1).max(6).default(3),
  fields: z.array(templateFieldSchema).min(1, '至少配置一个字段'),
  styles: templateStylesSchema,
});

// 目录模板
export const createCatalogTemplateSchema = z.object({
  name: z.string().min(1, '模板名称不能为空').max(100),
  description: optionalString,
  config: templateConfigSchema,
  pageSize: z.enum(['A4', 'A3', 'Letter']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  margin: z.string().default('20'),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateCatalogTemplateSchema = createCatalogTemplateSchema.partial();

// 目录封面
export const createCatalogCoverSchema = z.object({
  name: z.string().min(1, '封面名称不能为空').max(100),
  type: z.enum(['front', 'back']),
  url: z.string().min(1, '封面URL不能为空').url('URL格式不正确'),
  thumbnail: z.string().url('缩略图URL格式不正确').optional().or(z.null()),
  size: z.number().int().positive().optional().or(z.null()),
  width: z.number().int().positive().optional().or(z.null()),
  height: z.number().int().positive().optional().or(z.null()),
  mimeType: z.string().optional().or(z.null()),
  isActive: z.boolean().default(true),
});

export const updateCatalogCoverSchema = createCatalogCoverSchema.partial();

// 目录
export const createCatalogSchema = z.object({
  name: z.string().min(1, '目录名称不能为空').max(200),
  description: optionalString,
  templateId: z.string().uuid('模板ID格式不正确'),
  frontCoverId: optionalUuid,
  backCoverId: optionalUuid,
  productIds: z.array(z.string().uuid('产品ID格式不正确')).min(1, '至少选择一个产品'),
});

export const updateCatalogSchema = z.object({
  name: z.string().min(1, '目录名称不能为空').max(200).optional(),
  description: optionalString,
  templateId: z.string().uuid('模板ID格式不正确').optional(),
  frontCoverId: optionalUuid,
  backCoverId: optionalUuid,
  productIds: z.array(z.string().uuid('产品ID格式不正确')).optional(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
  pdfUrl: z.string().url('PDF URL格式不正确').optional().or(z.null()),
  pdfSize: z.number().int().positive().optional().or(z.null()),
  pageCount: z.number().int().positive().optional().or(z.null()),
  error: z.string().optional().or(z.null()),
  generatedAt: z.coerce.date().optional().or(z.null()),
});

// ==========================
// 类型导出
// ==========================
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDictionaryTypeInput = z.infer<typeof createDictionaryTypeSchema>;
export type UpdateDictionaryTypeInput = z.infer<typeof updateDictionaryTypeSchema>;
export type CreateDictionaryInput = z.infer<typeof createDictionarySchema>;
export type UpdateDictionaryInput = z.infer<typeof updateDictionarySchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// 目录册类型导出
export type TemplateFieldInput = z.infer<typeof templateFieldSchema>;
export type TemplateStylesInput = z.infer<typeof templateStylesSchema>;
export type TemplateConfigInput = z.infer<typeof templateConfigSchema>;
export type CreateCatalogTemplateInput = z.infer<typeof createCatalogTemplateSchema>;
export type UpdateCatalogTemplateInput = z.infer<typeof updateCatalogTemplateSchema>;
export type CreateCatalogCoverInput = z.infer<typeof createCatalogCoverSchema>;
export type UpdateCatalogCoverInput = z.infer<typeof updateCatalogCoverSchema>;
export type CreateCatalogInput = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogInput = z.infer<typeof updateCatalogSchema>;
