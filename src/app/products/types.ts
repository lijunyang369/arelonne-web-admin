/**
 * 商品管理 — 前端表单类型定义。
 */

/** 商品基础信息 */
export interface ProductBasicInfo {
  name: string;
  slug: string;
  description: string;
  category_id: number | null;
  base_price: number;
  sale_price: number | null;
  cost_price: number | null;
  status: 'draft' | 'active' | 'inactive';
  sort: number;
}

/** 图片项 */
export interface ProductImageItem {
  id?: number;
  url: string;
  alt: string;
  sort: number;
  is_primary: boolean;
}

/** SKC 颜色组（含图片） */
export interface SkcGroup {
  id?: number;
  color: string;
  color_hex: string;
  sort: number;
  images: ProductImageItem[];
  expanded: boolean;        // UI 状态：折叠/展开
}

/** SKU 变体 */
export interface ProductVariantItem {
  id?: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

/** 编辑页完整表单数据 */
export interface ProductFormData {
  basic: ProductBasicInfo;
  skcs: SkcGroup[];
  variants: ProductVariantItem[];
  meta: Record<string, unknown>;
}

/** 商品基础信息默认值 */
export const EMPTY_BASIC: ProductBasicInfo = {
  name: '',
  slug: '',
  description: '',
  category_id: null,
  base_price: 0,
  sale_price: null,
  cost_price: null,
  status: 'draft',
  sort: 0,
};

/** 表单默认值（新建商品） */
export const EMPTY_FORM: ProductFormData = {
  basic: { ...EMPTY_BASIC },
  skcs: [],
  variants: [],
  meta: {},
};

/** 预设尺码列表 — 与品牌尺码表一致（XS–XL 五码，2026-08-18 定稿） */
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
