/**
 * 商品编辑页 — 详情获取 + 整体保存 hook。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct, createProduct, updateProduct } from '@/lib/api/products';
import { ApiError } from '@/lib/api/client';
import type { AdminProductDetail } from '@/lib/api/products';
import type { ProductFormData, ProductBasicInfo } from '../../types';
import { EMPTY_FORM } from '../../types';

export function useProductDetail(id: string) {
  const router = useRouter();
  const isNew = id === 'new';

  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hope_admin_token') || '';
  };

  /** 加载商品详情（编辑模式） */
  const loadProduct = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await getProduct(getToken(), Number(id));
      setProduct(detail);
      // 将后端数据映射为表单结构
      setForm({
        basic: {
          name: detail.name,
          slug: detail.slug,
          description: detail.description || '',
          category_id: detail.category?.id ?? null,
          base_price: detail.base_price,
          sale_price: detail.sale_price ?? null,
          cost_price: detail.cost_price ?? null,
          status: detail.status,
          sort: detail.sort ?? 0,
        },
        // 详情接口 skcs 映射为表单 SKC 组（结构与 useImages 一致，UI 默认折叠）
        skcs: (detail.skcs ?? []).map((s) => ({
          id: s.id,
          color: s.color,
          color_hex: s.color_hex ?? '#000000',
          slug: s.slug,
          sort: s.sort,
          expanded: false,
          images: s.images.map((img) => ({
            id: img.id,
            url: img.url,
            thumb_url: img.thumb_url,
            alt: img.alt ?? '',
            sort: img.sort,
            is_primary: img.is_primary,
          })),
        })),
        variants: [],   // 变体由独立 hook 管理
        meta: detail.meta || {},
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  /** 保存 */
  const handleSave = async () => {
    setSaveError(null);

    // 基础信息校验
    const { basic } = form;
    if (!basic.name.trim()) { setSaveError('商品名称不能为空'); setActiveTab(0); return; }
    if (!basic.slug.trim()) { setSaveError('Slug 不能为空'); setActiveTab(0); return; }
    if (!basic.category_id) { setSaveError('请选择分类'); setActiveTab(0); return; }
    if (basic.base_price < 0) { setSaveError('原价不能为负数'); setActiveTab(0); return; }

    setSaving(true);
    try {
      const payload = {
        name: basic.name,
        slug: basic.slug,
        description: basic.description || null,
        category_id: basic.category_id!,
        base_price: basic.base_price,
        sale_price: basic.sale_price ?? null,
        cost_price: basic.cost_price ?? null,
        status: basic.status,
        sort: basic.sort,
        meta: Object.keys(form.meta).length > 0 ? form.meta : null,
      };

      if (isNew) {
        await createProduct(getToken(), payload);
      } else {
        // SKC/图片快照随保存持久化：expanded/thumb_url 为 UI/展示字段不提交；
        // 新增颜色组无 slug 时按导入管线约定派生（{商品id}-{商品slug}-{颜色}）
        const skcs = form.skcs
          .filter((s) => s.color.trim() !== '')
          .map((s) => ({
            color: s.color,
            color_hex: s.color_hex || null,
            slug: s.slug || `${Number(id)}-${basic.slug}-${s.color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
            images: s.images
              .filter((img) => img.url.trim() !== '')
              .map((img) => ({ url: img.url.trim(), alt: img.alt || null, sort: img.sort, is_primary: img.is_primary })),
          }));
        await updateProduct(getToken(), Number(id), { ...payload, skcs });
      }
      router.push('/products');
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /** 更新基础信息字段 */
  const updateBasic = (partial: Partial<ProductBasicInfo>) => {
    setForm((prev) => ({ ...prev, basic: { ...prev.basic, ...partial } }));
  };

  return {
    isNew, product, loading, error,
    activeTab, setActiveTab,
    form, setForm, updateBasic,
    saving, saveError, setSaveError,
    handleSave,
  };
}
