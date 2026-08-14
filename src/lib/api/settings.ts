/**
 * 站点设置 API 请求。
 */

import { adminFetch } from './client';

/** 设置项 */
export interface SettingItem {
  key: string;
  value: string;
  type: string;
  group: string;
}

/**
 * 获取指定分组的设置。
 */
export async function getSettings(token: string, group?: string): Promise<SettingItem[]> {
  const qs = group ? `?group=${encodeURIComponent(group)}` : '';
  const res = await adminFetch<{ data: SettingItem[] }>(`/admin/settings${qs}`, token);
  return res.data;
}

/**
 * 更新设置（upsert）。
 */
export async function updateSettings(
  token: string,
  settings: Array<{ key: string; value: string | number }>,
): Promise<{ message: string }> {
  const res = await adminFetch<{ data: { message: string } }>('/admin/settings', token, {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
  return res.data;
}
