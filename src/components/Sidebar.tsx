'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api/client';

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 首次挂载时验证登录状态
    const token = localStorage.getItem('hope_admin_token');
    const stored = localStorage.getItem('hope_admin_user');

    if (!token || !stored) {
      setLoading(false);
      if (pathname !== '/login') router.push('/login');
      return;
    }

    // 调一个后台接口验证 Token 有效性
    adminFetch<{ data: unknown }>('/admin/products', token)
      .then(() => {
        setUser(JSON.parse(stored!));
      })
      .catch(() => {
        // Token 无效，清空并跳转
        localStorage.removeItem('hope_admin_token');
        localStorage.removeItem('hope_admin_user');
        if (pathname !== '/login') router.push('/login');
      })
      .finally(() => setLoading(false));
  }, []); // 只在挂载时执行一次

  if (pathname === '/login') return children;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    );
  }

  const links = [
    { href: '/', label: '仪表盘' },
    { href: '/products', label: '商品管理' },
    { href: '/orders', label: '订单管理' },
    { href: '/settings', label: '系统设置' },
  ];

  const sidebar = (
    <nav className="flex h-full flex-col bg-sidebar text-white">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight" onClick={() => setOpen(false)}>
          Arelonne
        </Link>
        <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white lg:hidden" aria-label="关闭菜单">
          ✕
        </button>
      </div>
      {user && <p className="px-5 pb-3 text-xs text-white/40">当前用户：{user.name}</p>}
      <div className="flex-1 space-y-0.5 px-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
            className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === l.href ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-sidebar-hover hover:text-white'
            }`}>{l.label}</Link>
        ))}
      </div>
      <button onClick={() => { localStorage.removeItem('hope_admin_token'); localStorage.removeItem('hope_admin_user'); router.push('/login'); }}
        className="mx-3 mb-4 mt-2 rounded-md px-3 py-2 text-left text-xs text-white/35 hover:bg-sidebar-hover hover:text-white/60 transition-colors">
        退出登录
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-56">{sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <div className="flex items-center border-b bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="flex flex-col gap-1 p-1" aria-label="菜单">
            <span className="block h-0.5 w-5 bg-gray-700" />
            <span className="block h-0.5 w-5 bg-gray-700" />
            <span className="block h-0.5 w-5 bg-gray-700" />
          </button>
          <span className="ml-3 font-semibold">Arelonne 管理后台</span>
        </div>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
