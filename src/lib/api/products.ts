/**
 * 商品管理 API 请求。
 */

import { adminFetch } from './client';

// ============================================================================
// 响应类型（对应后端 ProductResource / ProductListResource）
// ============================================================================

export interface AdminProductImage {
  id: number;
  url: string;
  /** 480 宽缩略图（api Resource 派生） */
  thumb_url: string;
  alt: string | null;
  sort: number;
  is_primary: boolean;
}

export interface AdminVariant {
  id: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  image: string | null;
}

/** SKC 颜色组（Task 7 详情接口新增） */
export interface AdminProductSkc {
  id: number;
  color: string;
  color_hex: string;
  slug: string;
  status: string;
  sort: number;
  images: AdminProductImage[];
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: { id: number; name: string; slug: string } | null;
  base_price: number;
  sale_price: number | null;
  status: 'draft' | 'active' | 'inactive';
  meta: Record<string, unknown> | null;
  images: AdminProductImage[];
  /** SKC 颜色组（详情接口返回；列表接口未加载时为空数组） */
  skcs: AdminProductSkc[];
  created_at: string;
}

export interface AdminProductDetail extends AdminProduct {
  cost_price: number | null;
  sort: number;
  variants: AdminVariant[];
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ProductListResponse {
  data: AdminProduct[];
  meta: PaginationMeta;
}

interface ProductDetailResponse {
  data: AdminProductDetail;
}

// ============================================================================
// 请求参数
// ============================================================================

export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category_id?: number;
}

export interface ProductCreateData {
  name: string;
  slug: string;
  description?: string | null;
  category_id: number;
  base_price: number;
  sale_price?: number | null;
  cost_price?: number | null;
  status: 'draft' | 'active' | 'inactive';
  sort?: number;
  meta?: Record<string, unknown> | null;
}

// ============================================================================
// API 方法
// ============================================================================

/** 获取商品列表（服务端分页 + 筛选） */
export async function getProducts(
  token: string,
  params?: ProductListParams,
): Promise<ProductListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.per_page) sp.set('per_page', String(params.per_page));
  if (params?.search) sp.set('search', params.search);
  if (params?.status) sp.set('status', params.status);
  if (params?.category_id) sp.set('category_id', String(params.category_id));
  const qs = sp.toString();
  return adminFetch<ProductListResponse>(`/admin/products${qs ? `?${qs}` : ''}`, token);
}

/** 获取单个商品（含变体和图片） */
export async function getProduct(token: string, id: number): Promise<AdminProductDetail> {
  const res = await adminFetch<ProductDetailResponse>(`/admin/products/${id}`, token);
  return res.data;
}

/** 创建商品 */
export async function createProduct(
  token: string,
  data: ProductCreateData,
): Promise<AdminProductDetail> {
  const res = await adminFetch<ProductDetailResponse>('/admin/products', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

/** 更新商品 */
export async function updateProduct(
  token: string,
  id: number,
  data: Partial<ProductCreateData>,
): Promise<AdminProductDetail> {
  const res = await adminFetch<ProductDetailResponse>(`/admin/products/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

/** 删除商品（软删除） */
export async function deleteProduct(token: string, id: number): Promise<void> {
  await adminFetch<void>(`/admin/products/${id}`, token, { method: 'DELETE' });
}

/** 批量修改状态（逐条调用） */
export async function batchUpdateStatus(
  token: string,
  ids: number[],
  status: string,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await updateProduct(token, id, { status: status as 'draft' | 'active' | 'inactive' });
      success++;
    } catch {
      failed++;
    }
  }
  return { success, failed };
}

/** 批量删除（逐条调用） */
export async function batchDelete(
  token: string,
  ids: number[],
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await deleteProduct(token, id);
      success++;
    } catch {
      failed++;
    }
  }
  return { success, failed };
}
