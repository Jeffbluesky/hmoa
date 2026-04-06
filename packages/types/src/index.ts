// 共享类型定义：用户系统 + 基础数据 + 产品管理

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithoutPassword {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface DictionaryType {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DictionaryTypeWithItems extends DictionaryType {
  items: Dictionary[];
}

export interface Dictionary {
  id: string;
  code: string;
  name: string;
  en: string | null;
  jp: string | null;
  symbol: string | null;
  other: string | null;
  typeId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DictionaryWithType extends Dictionary {
  type: DictionaryType | null;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  specification: string | null;
  color: string | null;
  colorCode: string | null;
  unitId: string | null;
  supplierId: string | null;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialWithRelations extends Material {
  unit: DictionaryWithType | null;
  supplier: Pick<Supplier, 'id' | 'code' | 'name'> | null;
}

export interface Product {
  id: string;
  code: string;
  internalCode: string;
  name: string;
  itemNo: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  seatH: string | null;
  color: string | null;
  colorCode: string | null;
  categoryId: string | null;
  colorDictId: string | null;
  materialId: string | null;
  remark: string | null;
  images: string | null;
  attachments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBOM {
  id: string;
  productId: string;
  materialId: string | null;
  childProductId: string | null;
  quantity: number;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBOMWithRelations extends ProductBOM {
  material: Material | null;
  childProduct: Product | null;
}

export interface ProductWithBOM extends Product {
  category: DictionaryWithType | null;
  colorDict: DictionaryWithType | null;
  boms: ProductBOMWithRelations[];
}

export interface ProductBOMInput {
  materialId?: string;
  childProductId?: string;
  quantity: number;
  remark?: string;
}

export interface Attachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

// ==========================
// CRM 类型定义
// ==========================

export interface Customer {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  typeId: string | null;
  country: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  remark: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  finalCustomerId: string | null;
}

export interface CustomerWithRelations extends Customer {
  type: DictionaryWithType | null;
  contacts: Contact[];
  finalCustomer: Customer | null;
}


export interface Supplier {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  city: string | null;
  typeId: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  remark: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierWithRelations extends Supplier {
  type: DictionaryWithType | null;
  contacts: Contact[];
}

export interface Contact {
  id: string;
  customerId: string | null;
  supplierId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  isPrimary: boolean;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactWithRelations extends Contact {
  customer: Customer | null;
  supplier: Supplier | null;
}

export interface InlineContactInput {
  id?: string;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  shortName?: string;
  typeId?: string;
  country?: string;
  address?: string;
  remark?: string;
  isActive?: boolean;
  finalCustomerId?: string;
  contacts?: InlineContactInput[];
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}


export interface CreateSupplierInput {
  name: string;
  shortName?: string;
  city?: string;
  typeId?: string;
  address?: string;
  remark?: string;
  isActive?: boolean;
  contacts?: InlineContactInput[];
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

export interface CreateContactInput {
  customerId?: string;
  supplierId?: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  isPrimary?: boolean;
  remark?: string;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {}

// ==========================
// 目录册相关类型定义
// ==========================

// 可用的产品字段枚举
export type ProductFieldName =
  | 'name'           // 产品名称
  | 'itemNo'         // 货号
  | 'code'           // 产品编码
  | 'internalCode'   // 内部编号
  | 'length'         // 长
  | 'width'          // 宽
  | 'height'         // 高
  | 'seatH'          // 座高
  | 'color'          // 颜色
  | 'colorCode'      // 色号
  | 'category'       // 分类
  | 'colorDict'      // 颜色字典
  | 'mainImage'      // 主图
  | 'images'         // 所有图片
  | 'remark';        // 备注

export interface TemplateField {
  id: string;
  type: 'text' | 'image' | 'dimension' | 'color' | 'code';
  productField: ProductFieldName; // 关联的产品字段
  label: string; // 显示标签
  visible: boolean;
  order: number;
  width?: string; // 百分比或固定值
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: 'left' | 'center' | 'right';
  };
}

export interface TemplateConfig {
  // 布局类型: grid (网格), list (列表), mixed (混合)
  layout: 'grid' | 'list' | 'mixed';

  // 每页产品数量 (网格布局时使用)
  itemsPerPage: number;

  // 列数 (网格布局)
  columns: number;

  // 字段配置
  fields: TemplateField[];

  // 样式配置
  styles: {
    titleFontSize: number;
    titleFontWeight: string;
    titleColor: string;
    fieldFontSize: number;
    fieldColor: string;
    backgroundColor: string;
    borderColor: string;
    padding: number;
    spacing: number;
  };
}

export interface CatalogTemplate {
  id: string;
  name: string;
  description: string | null;
  config: TemplateConfig;
  pageSize: string;
  orientation: string;
  margin: string;
  isActive: boolean;
  sortOrder: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogCover {
  id: string;
  name: string;
  type: 'front' | 'back';
  url: string;
  thumbnail: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Catalog {
  id: string;
  name: string;
  description: string | null;
  templateId: string;
  frontCoverId: string | null;
  backCoverId: string | null;
  productIds: string[];
  status: 'pending' | 'generating' | 'completed' | 'failed';
  pdfUrl: string | null;
  pdfSize: number | null;
  pageCount: number | null;
  error: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  generatedAt: Date | null;
}

export interface CatalogWithRelations extends Catalog {
  template: CatalogTemplate;
  frontCover: CatalogCover | null;
  backCover: CatalogCover | null;
  products?: Product[]; // 前端可能需要产品详情
}

// 创建/更新模板的输入类型
export interface CreateCatalogTemplateInput {
  name: string;
  description?: string;
  config: TemplateConfig;
  pageSize?: string;
  orientation?: string;
  margin?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCatalogTemplateInput extends Partial<CreateCatalogTemplateInput> {}

// 创建/更新封面的输入类型
export interface CreateCatalogCoverInput {
  name: string;
  type: 'front' | 'back';
  url: string;
  thumbnail?: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  isActive?: boolean;
}

export interface UpdateCatalogCoverInput extends Partial<CreateCatalogCoverInput> {}

// 创建/更新目录的输入类型
export interface CreateCatalogInput {
  name: string;
  description?: string;
  templateId: string;
  frontCoverId?: string;
  backCoverId?: string;
  productIds: string[];
}

export interface UpdateCatalogInput extends Partial<CreateCatalogInput> {
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  pdfUrl?: string;
  pdfSize?: number;
  pageCount?: number;
  error?: string;
  generatedAt?: Date;
}
