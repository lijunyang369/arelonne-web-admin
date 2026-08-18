/**
 * 尺码选项 API 客户端。
 */

import { adminFetch } from './client';

/** 尺码选项(与 SizeOptionResource 契约一致) */
export interface SizeOption {
  id: number;
  name: string;
  sort: number;
}

/** 尺码列表(后端按 sort、id 升序) */
export async function getSizeOptions(token: string): Promise<SizeOption[]> {
  const res = await adminFetch<{ data: SizeOption[] }>('/admin/size-options', token);
  return res.data;
}

/** 创建尺码(名称必填且唯一,后端 unique 校验) */
export async function createSizeOption(
  token: string,
  payload: { name: string; sort: number },
): Promise<SizeOption> {
  const res = await adminFetch<{ data: SizeOption }>('/admin/size-options', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** 更新尺码(排序交换等局部更新) */
export async function updateSizeOption(
  token: string,
  id: number,
  payload: { name?: string; sort?: number },
): Promise<SizeOption> {
  const res = await adminFetch<{ data: SizeOption }>(`/admin/size-options/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** 删除尺码(被商品引用时后端 422,抛出 message) */
export async function deleteSizeOption(token: string, id: number): Promise<void> {
  await adminFetch<void>(`/admin/size-options/${id}`, token, { method: 'DELETE' });
}
