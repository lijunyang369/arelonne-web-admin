/**
 * Admin API 客户端。
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

/** 图片 CDN 基址（dev 指向 web-store 本地服务，生产指向 cdn.arelonne.com） */
const IMAGE_BASE = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? '').replace(/\/+$/, '');

/** 补全图片相对路径为绝对 URL（外站 URL 原样返回） */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!IMAGE_BASE) return null; // 未配置基址时不猜测
  return IMAGE_BASE + (path.startsWith('/') ? path : `/${path}`);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, json.message || `Request failed`, json.errors);
  }

  return json as T;
}

export async function adminFetch<T = unknown>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      'Authorization': `Bearer ${token}`,
    },
  });
}

/** 读取认证 token（localStorage key 与登录页写入保持一致；SSR 场景返回 null） */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hope_admin_token');
}
