/**
 * 分类管理 — 数据获取 + 树形列表 + CRUD 状态 hook。
 */

import { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api/categories';
import { ApiError } from '@/lib/api/client';
import type { CategoryNode } from '@/lib/api/categories';
import type { CategoryFormData } from './types';

/** 空表单(新建初始值) */
const EMPTY_FORM: CategoryFormData = { name: '', slug: '', parent_id: '', sort: '0', status: 'active' };

/** 名称转小写 kebab-case slug(与后端 normalizeSlug 规范化一致;中文名结果为空白) */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function useCategoryList() {
  // ---- 列表 ----
  const [items, setItems] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- 模态框 ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
  /** slug 是否被手动编辑过(手动编辑后不再随名称自动生成) */
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- 删除 ----
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hope_admin_token') || '';
  };

  /** 加载分类树(status=all 含停用) */
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getCategories(getToken(), 'all'));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ---- 模态框操作 ----

  /** 打开新建弹层(重置表单与 slug 自动生成状态) */
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setFormError(null);
    setModalOpen(true);
  };

  /** 打开新建弹层并预选上级分类(分组头的「添加子分类」) */
  const openAddChild = (root: CategoryNode) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, parent_id: String(root.id) });
    setSlugTouched(false);
    setFormError(null);
    setModalOpen(true);
  };

  /** 打开编辑弹层(slug 只读回显,锁定自动生成) */
  const openEdit = (cat: CategoryNode) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id === null ? '' : String(cat.parent_id),
      sort: String(cat.sort),
      status: cat.status,
    });
    setSlugTouched(true);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  /** 表单变更:名称变化且 slug 未手动编辑时自动生成 slug */
  const handleFormChange = (next: CategoryFormData) => {
    if (next.name !== form.name && !slugTouched) {
      next = { ...next, slug: toSlug(next.name) };
    }
    setForm(next);
  };

  /** 提交新建/编辑(创建带 slug,更新不带 — 后端 prohibited) */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const base = {
        name: form.name,
        parent_id: form.parent_id === '' ? null : Number(form.parent_id),
        sort: Number(form.sort) || 0,
        status: form.status,
      };
      if (editingId !== null) {
        await updateCategory(getToken(), editingId, base);
      } else {
        await createCategory(getToken(), {
          ...base,
          ...(form.slug ? { slug: form.slug } : {}),
        });
      }
      closeModal();
      loadItems();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ---- 停用/启用 ----

  /** 行内切换分类状态(不打开弹层) */
  const handleToggleStatus = async (cat: CategoryNode) => {
    try {
      await updateCategory(getToken(), cat.id, {
        status: cat.status === 'active' ? 'inactive' : 'active',
      });
      loadItems();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '操作失败，请重试');
    }
  };

  // ---- 删除 ----

  /** 删除分类(被拒时用页面错误条展示后端 message) */
  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(getToken(), id);
      setDeletingId(null);
      loadItems();
    } catch (e) {
      setDeletingId(null);
      setError(e instanceof ApiError ? e.message : '删除失败，请重试');
    }
  };

  return {
    // 列表
    items, loading, error,
    // 模态框
    modalOpen, editingId, form, saving, formError,
    openCreate, openAddChild, openEdit, closeModal, handleSubmit, handleFormChange, setSlugTouched,
    // 行内操作
    handleToggleStatus,
    // 删除
    deletingId, handleDelete, setDeletingId,
  };
}
