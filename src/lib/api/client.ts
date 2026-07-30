/**
 * Admin API 客户端。
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

/** 图片资源基域名（API_BASE 去掉 /api 后缀） */
const IMAGE_BASE = API_BASE.replace(/\/api\/?$/, '');

/** 补全图片相对路径为绝对 URL */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return IMAGE_BASE + path;
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
