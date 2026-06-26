'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, adminFetch, ApiError } from '@/lib/api/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // 已登录则直接跳转
  useEffect(() => {
    const token = localStorage.getItem('hope_admin_token');
    if (!token) { setChecking(false); return; }

    adminFetch('/admin/products', token)
      .then(() => router.push('/'))
      .catch(() => {
        localStorage.removeItem('hope_admin_token');
        localStorage.removeItem('hope_admin_user');
      })
      .finally(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch<{ data: { token: string; user: { name: string; email: string } } }>(
        '/admin/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );

      localStorage.setItem('hope_admin_token', res.data.token);
      localStorage.setItem('hope_admin_user', JSON.stringify(res.data.user));
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('网络错误，请重试。');
      }
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">验证中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">HOPE 管理后台</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">邮箱</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              placeholder="admin@hope.com" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
