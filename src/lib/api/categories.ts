/**
 * 分类管理 API 请求。
 */

import { adminFetch } from './client';

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  children: { id: number; name: string; slug: string }[];
}

interface CategoriesResponse {
  data: AdminCategory[];
}

/** 获取分类树 */
export async function getCategories(token: string): Promise<AdminCategory[]> {
  const res = await adminFetch<CategoriesResponse>('/admin/categories', token);
  return res.data;
}
