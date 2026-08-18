/**
 * 分类管理 API 客户端。
 */

import { adminFetch } from './client';

/** 分类节点(与后端 CategoryResource 契约一致;children 仅列表接口加载,创建/更新响应不含) */
export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  status: 'active' | 'inactive';
  sort: number;
  children?: CategoryNode[];
}

/** 兼容别名:商品列表页筛选下拉沿用旧类型名 */
export type AdminCategory = CategoryNode;

/** 分类列表(status=all 含停用;默认 active 供商品表单选择器) */
export async function getCategories(token: string, status: 'active' | 'all' = 'active'): Promise<CategoryNode[]> {
  const res = await adminFetch<{ data: CategoryNode[] }>(`/admin/categories?status=${status}`, token);
  return res.data;
}

/** 创建分类 */
export async function createCategory(
  token: string,
  payload: { name: string; slug?: string; parent_id?: number | null; sort?: number; status: 'active' | 'inactive' },
): Promise<CategoryNode> {
  const res = await adminFetch<{ data: CategoryNode }>('/admin/categories', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** 更新分类(slug 禁止提交) */
export async function updateCategory(
  token: string,
  id: number,
  payload: { name?: string; parent_id?: number | null; sort?: number; status?: 'active' | 'inactive' },
): Promise<CategoryNode> {
  const res = await adminFetch<{ data: CategoryNode }>(`/admin/categories/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** 删除分类(422 时抛出后端 message) */
export async function deleteCategory(token: string, id: number): Promise<void> {
  await adminFetch<null>(`/admin/categories/${id}`, token, { method: 'DELETE' });
}
