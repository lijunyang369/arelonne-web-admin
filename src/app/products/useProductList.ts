/**
 * 商品管理 — 列表数据获取 + 分页 + 筛选 + 批量操作 hook。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts, batchUpdateStatus, batchDelete } from '@/lib/api/products';
import { ApiError } from '@/lib/api/client';
import type { AdminProduct } from '@/lib/api/products';

export function useProductList() {
  // ---- 列表 ----
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- 筛选 ----
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number[]>([]);

  // ---- 批量操作 ----
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // ---- 删除 ----
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 搜索防抖 timer
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const getToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hope_admin_token') || '';
  };

  // 请求序号：防止旧请求覆盖新筛选结果
  const requestSeq = useRef(0);

  /** 加载商品列表 */
  const loadProducts = useCallback(async (
    p: number,
    ps: number,
    status: string,
    searchText: string,
    catIds: number[],
  ) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts(getToken(), {
        page: p,
        per_page: ps,
        ...(status ? { status } : {}),
        ...(searchText ? { search: searchText } : {}),
        ...(catIds.length > 0 ? { category_id: catIds[0] } : {}),
      });
      // 忽略过期响应
      if (seq !== requestSeq.current) return;
      setProducts(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError(e instanceof ApiError ? e.message : '加载失败');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  // 搜索防抖：search 变化 300ms 后更新 debouncedSearch
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // 筛选条件变化时重新加载（重置页码）
  useEffect(() => {
    loadProducts(1, pageSize, statusFilter, debouncedSearch, categoryFilter);
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, debouncedSearch, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 翻页 */
  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
    setSelectedIds(new Set());
    loadProducts(p, ps, statusFilter, debouncedSearch, categoryFilter);
  };

  // ---- 选择 ----

  /** 切换单行选择 */
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /** 全选当前页 */
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  // ---- 批量操作 ----

  const handleBatchStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    const result = await batchUpdateStatus(getToken(), Array.from(selectedIds), status);
    setBatchLoading(false);
    setSelectedIds(new Set());
    loadProducts(page, pageSize, statusFilter, debouncedSearch, categoryFilter);
    return result;
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    const result = await batchDelete(getToken(), Array.from(selectedIds));
    setBatchLoading(false);
    setSelectedIds(new Set());
    // 删除后调整页码，防止当前页为空
    const newTotal = total - selectedIds.size;
    const lastPage = Math.max(1, Math.ceil(newTotal / pageSize));
    const targetPage = page > lastPage ? lastPage : page;
    loadProducts(targetPage, pageSize, statusFilter, debouncedSearch, categoryFilter);
    setPage(targetPage);
    return result;
  };

  // ---- 删除 ----

  const handleDelete = async (id: number) => {
    const { deleteProduct } = await import('@/lib/api/products');
    try {
      await deleteProduct(getToken(), id);
      setDeletingId(null);
      const newTotal = total - 1;
      const lastPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = page > lastPage ? lastPage : page;
      loadProducts(targetPage, pageSize, statusFilter, debouncedSearch, categoryFilter);
      setPage(targetPage);
    } catch (e) {
      setDeletingId(null);
      setError(e instanceof ApiError ? e.message : '删除失败，请重试');
    }
  };

  return {
    // 列表
    items: products, total, page, pageSize, loading, error,
    // 筛选
    statusFilter, setStatusFilter, search, setSearch, categoryFilter, setCategoryFilter,
    // 分页
    handlePageChange,
    // 选择
    selectedIds, toggleSelect, toggleSelectAll,
    // 批量
    batchLoading, handleBatchStatus, handleBatchDelete,
    // 删除
    deletingId, handleDelete, setDeletingId,
    // 刷新
    refresh: () => loadProducts(page, pageSize, statusFilter, debouncedSearch, categoryFilter),
  };
}
