'use client';

/**
 * 商品管理列表页 — 状态编排层。
 * 数据/分页/筛选/批量操作 → useProducts hook
 * 桌面端列定义            → makeColumns()
 * 移动端卡片列表          → MobileProductCard
 */

import { useProductList } from './useProductList';
import { makeColumns } from './columns';
import { MobileProductCard } from './MobileProductCard';
import { Table } from '@/components/shared/Table';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getCategories } from '@/lib/api/categories';
import type { AdminCategory } from '@/lib/api/categories';

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'active', label: '在售' },
  { key: 'inactive', label: '下架' },
];

export default function ProductsPage() {
  const router = useRouter();
  const {
    items, total, page, pageSize, loading, error,
    statusFilter, setStatusFilter, search, setSearch,
    categoryFilter, setCategoryFilter,
    handlePageChange,
    selectedIds, toggleSelect, toggleSelectAll,
    batchLoading, handleBatchStatus, handleBatchDelete,
    deletingId, handleDelete, setDeletingId,
  } = useProductList();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // 加载分类列表
  useEffect(() => {
    const token = localStorage.getItem('hope_admin_token') || '';
    getCategories(token).then(setCategories).catch(() => {});
  }, []);

  // 点击分类下拉框外部时关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns = makeColumns({
    selectedIds,
    onToggleSelect: toggleSelect,
    onToggleSelectAll: toggleSelectAll,
    allSelected: items.length > 0 && selectedIds.size === items.length,
    onEdit: (id) => router.push(`/products/${id}`),
    onRowClick: (id) => router.push(`/products/${id}`),
    onRequestDelete: (id) => setDeletingId(id),
    onConfirmDelete: (id) => handleDelete(id),
    onCancelDelete: () => setDeletingId(null),
    deletingId,
  });

  const emptyText = statusFilter
    ? `暂无${STATUS_TABS.find((t) => t.key === statusFilter)?.label || ''}状态的商品`
    : '暂无商品，点击「添加商品」创建';

  /** 分类单选切换 */
  const toggleCategory = (id: number) => {
    setCategoryFilter((prev) =>
      prev.includes(id) ? [] : [id]
    );
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">商品管理</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* 操作栏 Row 1：状态 Tabs + 搜索 */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {STATUS_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setStatusFilter(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索商品名称..."
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-gray-900 focus:outline-none w-48 lg:w-56"
          />
          <button type="button" onClick={() => router.push('/products/new')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
            添加商品
          </button>
        </div>
      </div>

      {/* 操作栏 Row 2：分类筛选 + 批量操作 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative" ref={catDropdownRef}>
          <button type="button" onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter.length > 0 ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}>
            全部分类 {categoryFilter.length > 0 ? `(${categoryFilter.length})` : '▼'}
          </button>
          {catDropdownOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="max-h-64 overflow-y-auto p-2">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <p className="px-2 py-1 text-xs font-medium text-gray-400">{cat.name}</p>
                    {cat.children?.map((child) => (
                      <label key={child.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={categoryFilter.includes(child.id)}
                          onChange={() => toggleCategory(child.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300" />
                        <span className="text-sm text-gray-700">{child.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="px-2 py-2 text-xs text-gray-400">暂无分类</p>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">已选 {selectedIds.size} 项</span>
            <button type="button" disabled={batchLoading}
              onClick={() => handleBatchStatus('active')}
              className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50">
              批量上架
            </button>
            <button type="button" disabled={batchLoading}
              onClick={() => handleBatchStatus('inactive')}
              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
              批量下架
            </button>
            <button type="button" disabled={batchLoading}
              onClick={handleBatchDelete}
              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
              批量删除
            </button>
          </div>
        )}
      </div>

      {/* 桌面端表格 */}
      <div className="hidden md:block">
        <Table
          columns={columns} data={items} total={total}
          currentPage={page} currentPageSize={pageSize}
          onPageChange={handlePageChange} onRowClick={(p) => router.push(`/products/${p.id}`)}
          keyExtractor={(p) => p.id}
          loading={loading} emptyText={emptyText}
        />
      </div>

      {/* 移动端卡片 */}
      <div className="md:hidden">
        <MobileProductCard
          items={items} loading={loading} emptyText={emptyText}
          deletingId={deletingId} page={page} pageSize={pageSize} total={total}
          onEdit={(id) => router.push(`/products/${id}`)}
          onRowClick={(id) => router.push(`/products/${id}`)}
          onRequestDelete={(id) => setDeletingId(id)}
          onConfirmDelete={(id) => handleDelete(id)}
          onCancelDelete={() => setDeletingId(null)}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
