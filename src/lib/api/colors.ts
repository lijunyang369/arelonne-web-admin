/**
 * 颜色管理 API 请求。
 */

import { adminFetch } from './client';

/** 颜色 */
export interface AdminColor {
  id: number;
  name: string;
  name_zh: string | null;
  hex: string;
  status: string;
  updated_at: string | null;
  updated_by: string | null;
}

/** 分页元数据 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/** 颜色列表响应（含分页） */
export interface ColorListResponse {
  data: AdminColor[];
  meta: PaginationMeta;
}

/** 获取颜色（服务端分页） */
export async function getColors(
  token: string,
  params?: { page?: number; per_page?: number; status?: string },
): Promise<ColorListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.per_page) sp.set('per_page', String(params.per_page));
  if (params?.status) sp.set('status', params.status);
  const qs = sp.toString();
  return adminFetch<ColorListResponse>(`/admin/colors${qs ? `?${qs}` : ''}`, token);
}

/** 单个颜色响应 */
interface ColorResponse {
  data: AdminColor;
}

/** 创建颜色 */
export async function createColor(
  token: string,
  data: { name: string; name_zh?: string; hex: string; status: string },
): Promise<AdminColor> {
  const res = await adminFetch<ColorResponse>('/admin/colors', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

/** 更新颜色 */
export async function updateColor(
  token: string,
  id: number,
  data: { name?: string; name_zh?: string; hex?: string; status?: string },
): Promise<AdminColor> {
  const res = await adminFetch<ColorResponse>(`/admin/colors/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

/** 删除颜色 */
export async function deleteColor(token: string, id: number): Promise<void> {
  await adminFetch<void>(`/admin/colors/${id}`, token, { method: 'DELETE' });
}
