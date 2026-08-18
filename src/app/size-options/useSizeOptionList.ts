/**
 * 尺码管理 — 数据获取 + 排序调整 + CRUD 状态 hook。
 */

import { useState, useEffect, useCallback } from 'react';
import { getSizeOptions, createSizeOption, updateSizeOption, deleteSizeOption } from '@/lib/api/sizeOptions';
import { ApiError } from '@/lib/api/client';
import type { SizeOption } from '@/lib/api/sizeOptions';
import type { SizeOptionFormData } from './types';

/** 空表单(新建初始值) */
const EMPTY_FORM: SizeOptionFormData = { name: '', sort: '0' };

export function useSizeOptionList() {
  // ---- 列表 ----
  const [items, setItems] = useState<SizeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- 排序调整 ----
  /** 正在调整排序的尺码 id(禁用操作按钮防止连点) */
  const [movingId, setMovingId] = useState<number | null>(null);

  // ---- 模态框 ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SizeOptionFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- 删除 ----
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hope_admin_token') || '';
  };

  /** 加载尺码列表(后端按 sort、id 升序返回) */
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getSizeOptions(getToken()));
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

  /** 打开新建弹层(重置表单) */
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  /** 打开编辑弹层(回显名称与排序) */
  const openEdit = (opt: SizeOption) => {
    setEditingId(opt.id);
    setForm({ name: opt.name, sort: String(opt.sort) });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  /** 提交新建/编辑(名称必填,后端 unique 校验,422 时错误条展示后端 message) */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = { name: form.name, sort: Number(form.sort) || 0 };
      if (editingId !== null) {
        await updateSizeOption(getToken(), editingId, payload);
      } else {
        await createSizeOption(getToken(), payload);
      }
      closeModal();
      loadItems();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ---- 排序调整 ----

  /**
   * 上移/下移:与相邻行交换 sort 值后各 PUT 一次。
   * sort 相同时(如新建默认 0)交换无效,改为挪一档保证位移生效。
   */
  const handleMove = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return; // 已是首/尾行
    const a = items[index];
    const b = items[target];
    setMovingId(a.id);
    setError(null);
    try {
      if (a.sort !== b.sort) {
        // 常规:交换两个 sort 值
        await Promise.all([
          updateSizeOption(getToken(), a.id, { sort: b.sort }),
          updateSizeOption(getToken(), b.id, { sort: a.sort }),
        ]);
      } else if (dir === 1) {
        // 下移且 sort 相同:当前行排到目标行之后一档
        await updateSizeOption(getToken(), a.id, { sort: b.sort + 1 });
      } else if (b.sort > 0) {
        // 上移且 sort 相同:当前行排到目标行之前一档
        await updateSizeOption(getToken(), a.id, { sort: b.sort - 1 });
      } else {
        // 上移且目标 sort 为 0:目标行让位一档
        await Promise.all([
          updateSizeOption(getToken(), a.id, { sort: b.sort }),
          updateSizeOption(getToken(), b.id, { sort: b.sort + 1 }),
        ]);
      }
      loadItems();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '操作失败，请重试');
      // 补偿:交换可能部分生效,重新拉取保证 UI 与服务端一致
      loadItems();
    } finally {
      setMovingId(null);
    }
  };

  // ---- 删除 ----

  /** 删除请求进行中(禁用确认/取消按钮,防双击重复 DELETE) */
  const [deleting, setDeleting] = useState(false);

  /** 删除尺码(被商品引用时后端 422,错误条展示 message) */
  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deleteSizeOption(getToken(), id);
      setDeletingId(null);
      loadItems();
    } catch (e) {
      setDeletingId(null);
      setError(e instanceof ApiError ? e.message : '删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  return {
    // 列表
    items, loading, error,
    // 模态框
    modalOpen, editingId, form, saving, formError,
    openCreate, openEdit, closeModal, handleSubmit, setForm,
    // 排序调整
    movingId, handleMove,
    // 删除
    deletingId, deleting, handleDelete, setDeletingId,
  };
}
