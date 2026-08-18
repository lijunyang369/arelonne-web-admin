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
  /** 480 宽缩略图（详情接口返回；表单新建图片时为空字符串，经 `||` 回退原图） */
  thumb_url: string;
  alt: string;
  sort: number;
  is_primary: boolean;
}

/** SKC 颜色组（含图片） */
export interface SkcGroup {
  id?: number;
  color: string;
  color_hex: string;
  /** 颜色 slug（详情接口带回，表单暂不编辑） */
  slug?: string;
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

/** 兜底列表，实际以 size-options API 为准（请求失败时回退） */
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
