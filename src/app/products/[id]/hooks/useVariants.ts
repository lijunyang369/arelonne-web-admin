/**
 * 商品编辑页 — SKU 变体管理逻辑。
 */

import { useState } from 'react';
import type { ProductVariantItem, ProductFormData } from '../../types';
import { DEFAULT_SIZES } from '../../types';

interface UseVariantsReturn {
  sizes: string[];
  /** 添加自定义尺码 */
  addSize: (size: string) => void;
  /** 删除尺码列（同时删除该尺码的所有变体） */
  removeSize: (size: string) => void;
  /** 获取或创建变体 */
  getVariant: (color: string, size: string) => ProductVariantItem | undefined;
  /** 更新变体 */
  updateVariant: (color: string, size: string, partial: Partial<ProductVariantItem>) => void;
  /** 批量填充选中的格子 */
  batchFill: (cells: { color: string; size: string }[], partial: Partial<ProductVariantItem>) => void;
  /** 获取 slug 前缀（用于 SKU 生成） */
  slug: string;
}

export function useVariants(
  form: ProductFormData,
  setForm: (f: ProductFormData) => void,
): UseVariantsReturn {
  const [sizes, setSizes] = useState<string[]>(() => {
    // 从已有变体提取尺码 + 默认尺码
    const existing = Array.from(new Set(form.variants.map((v) => v.size)));
    return Array.from(new Set([...DEFAULT_SIZES, ...existing]));
  });

  const slug = form.basic.slug || 'product';

  /** 生成 SKU */
  const makeSku = (color: string, size: string): string => {
    const colorAbbr = color.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    return `${slug}-${colorAbbr}-${size}`.replace(/[^a-zA-Z0-9-]/g, '');
  };

  const getVariant = (color: string, size: string): ProductVariantItem | undefined => {
    return form.variants.find((v) => v.color === color && v.size === size);
  };

  const updateVariant = (color: string, size: string, partial: Partial<ProductVariantItem>) => {
    const existing = getVariant(color, size);
    if (existing) {
      setForm({
        ...form,
        variants: form.variants.map((v) =>
          v.color === color && v.size === size ? { ...v, ...partial } : v
        ),
      });
    } else {
      const newVariant: ProductVariantItem = {
        sku: makeSku(color, size),
        color,
        size,
        price: partial.price ?? form.basic.base_price,
        stock: partial.stock ?? 0,
        status: partial.status ?? 'active',
      };
      setForm({ ...form, variants: [...form.variants, newVariant] });
    }
  };

  const batchFill = (cells: { color: string; size: string }[], partial: Partial<ProductVariantItem>) => {
    const updated = [...form.variants];
    cells.forEach(({ color, size }) => {
      const existing = updated.findIndex((v) => v.color === color && v.size === size);
      if (existing >= 0) {
        updated[existing] = { ...updated[existing], ...partial };
      } else {
        updated.push({
          sku: makeSku(color, size), color, size,
          price: partial.price ?? form.basic.base_price,
          stock: partial.stock ?? 0,
          status: partial.status ?? 'active',
        });
      }
    });
    setForm({ ...form, variants: updated });
  };

  const addSize = (size: string) => {
    if (size && !sizes.includes(size)) setSizes([...sizes, size]);
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter((s) => s !== size));
    setForm({ ...form, variants: form.variants.filter((v) => v.size !== size) });
  };

  return { sizes, addSize, removeSize, getVariant, updateVariant, batchFill, slug };
}
