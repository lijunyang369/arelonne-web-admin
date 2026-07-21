/**
 * 颜色管理 — 数据获取 + 分页 + CRUD 状态 hook。
 */

import { useState, useEffect, useCallback } from 'react';
import { getColors, createColor, updateColor, deleteColor } from '@/lib/api/colors';
import { ApiError } from '@/lib/api/client';
import type { AdminColor } from '@/lib/api/colors';
import type { ColorFormData } from './types';

const EMPTY_FORM: ColorFormData = { name: '', name_zh: '', hex: '#4F6EF7', status: 'active' };

export function useColorList() {
  // ---- 列表 ----
  const [colors, setColors] = useState<AdminColor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  // ---- 模态框 ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ColorFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- 删除 ----
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hope_admin_token') || '';
  };

  /** 加载颜色列表（服务端分页） */
  const loadColors = useCallback(async (p: number, ps: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getColors(getToken(), {
        page: p, per_page: ps, ...(status ? { status } : {}),
      });
      setColors(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载 + 筛选变化重新加载
  useEffect(() => {
    loadColors(1, pageSize, statusFilter);
    setPage(1);
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 翻页 */
  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
    loadColors(p, ps, statusFilter);
  };

  /** 刷新当前页 */
  const refresh = () => loadColors(page, pageSize, statusFilter);

  // ---- 模态框操作 ----

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (color: AdminColor) => {
    setEditingId(color.id);
    setForm({ name: color.name, name_zh: color.name_zh || '', hex: color.hex, status: color.status });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!/^#[0-9A-Fa-f]{6}$/.test(form.hex)) {
      setFormError('色值格式错误，请使用 #RRGGBB 格式');
      return;
    }
    setSaving(true);
    try {
      if (editingId !== null) {
        await updateColor(getToken(), editingId, form);
      } else {
        await createColor(getToken(), form);
      }
      closeModal();
      refresh();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ---- 删除 ----

  const handleDelete = async (id: number) => {
    try {
      await deleteColor(getToken(), id);
      setDeletingId(null);
      // 删除后如果当前页只剩这 1 条且不是第一页，回退一页
      const newTotal = total - 1;
      const lastPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = page > lastPage ? lastPage : page;
      loadColors(targetPage, pageSize, statusFilter);
      setPage(targetPage);
    } catch (e) {
      setDeletingId(null);
      setError(e instanceof ApiError ? e.message : '删除失败，请重试');
    }
  };

  return {
    // 列表
    items: colors, total, page, pageSize, loading, error, statusFilter,
    setStatusFilter, handlePageChange,
    // 模态框
    modalOpen, editingId, form, saving, formError,
    openCreate, openEdit, closeModal, handleSubmit, setForm,
    // 删除
    deletingId, handleDelete, setDeletingId,
  };
}
