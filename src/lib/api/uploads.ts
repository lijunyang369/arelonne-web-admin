/**
 * 上传 API client：presign → PUT 直传 → confirm。
 * presign/confirm 走带 token 的 adminFetch（Sanctum 认证）；
 * PUT 直传按 auth_required 分支：dev 分支（同源 dev-put）带 Bearer，
 * S3 presigned PUT 只发 upload_headers，绝不能带 Authorization（触发 CORS/双重鉴权失败）。
 */

import { adminFetch, getAuthToken } from './client';

/** presign 响应：直传地址与签名头 */
export interface PresignResult {
  key: string;
  upload_url: string;
  upload_headers: Record<string, string>;
  auth_required: boolean;
  expires_in: number;
}

/** confirm 响应：正式 URL 与缩略图 */
export interface ConfirmResult {
  url: string;
  thumb_url: string;
  width: number;
  height: number;
}

/** 签发直传（需认证） */
export async function presignUpload(params: {
  filename: string;
  type: 'banner' | 'editorial' | 'product-shot';
  mime: string;
  size: number;
}): Promise<PresignResult> {
  const token = getAuthToken();
  if (!token) throw new Error('未登录，请重新登录后再试');
  return adminFetch<PresignResult>('/admin/uploads/presign', token, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** 浏览器直传：按 auth_required 决定是否带 Bearer（S3 分支绝不带 Authorization） */
async function putToUploadUrl(presign: PresignResult, file: File): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': file.type,
    ...presign.upload_headers,
  };

  if (presign.auth_required) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(presign.upload_url, {
    method: 'PUT',
    headers,
    body: file,
  });
  if (!res.ok) {
    throw new Error(`直传失败: HTTP ${res.status}`);
  }
}

/** 确认上传（需认证） */
export async function confirmUpload(key: string): Promise<ConfirmResult> {
  const token = getAuthToken();
  if (!token) throw new Error('未登录，请重新登录后再试');
  return adminFetch<ConfirmResult>('/admin/uploads/confirm', token, {
    method: 'POST',
    body: JSON.stringify({ key }),
  });
}

/** 全流程：选择文件 → presign → 直传 → confirm → 返回结果 */
export async function uploadImage(
  file: File,
  type: 'banner' | 'editorial' | 'product-shot' = 'product-shot'
): Promise<ConfirmResult> {
  const presign = await presignUpload({
    filename: file.name,
    type,
    mime: file.type,
    size: file.size,
  });
  await putToUploadUrl(presign, file);
  return confirmUpload(presign.key);
}
