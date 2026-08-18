'use client';

/**
 * 商品编辑页 — Tab 1：基础信息表单。
 */

import { useEffect, useState } from 'react';
import { getCategories } from '@/lib/api/categories';
import type { CategoryNode } from '@/lib/api/categories';
import type { ProductFormData, ProductBasicInfo } from '../types';

interface BasicInfoTabProps {
  form: ProductFormData;
  updateBasic: (partial: Partial<ProductBasicInfo>) => void;
}

const STATUS_OPTIONS = [
  { key: 'draft' as const, label: '草稿' },
  { key: 'active' as const, label: '在售' },
  { key: 'inactive' as const, label: '下架' },
];

export function BasicInfoTab({ form, updateBasic }: BasicInfoTabProps) {
  const { basic } = form;
  /** 活跃分类树(选择器数据源,status=active) */
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  /** 全量分类树(含停用,用于把当前已停用分类并入下拉并标注) */
  const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('hope_admin_token') || '';
    getCategories(token).then(setCategories).catch(() => {});
    getCategories(token, 'all').then(setAllCategories).catch(() => {});
  }, []);

  // 当前商品分类若已不在 active 列表且全量列表中为停用,追加为下拉项并标注「已停用」
  const currentInactive = (() => {
    if (!basic.category_id) return null;
    const activeIds = new Set<number>();
    categories.forEach((c) => {
      activeIds.add(c.id);
      (c.children ?? []).forEach((ch) => activeIds.add(ch.id));
    });
    if (activeIds.has(basic.category_id)) return null;
    const cur = allCategories
      .flatMap((c) => [c, ...(c.children ?? [])])
      .find((c) => c.id === basic.category_id);
    return cur && cur.status === 'inactive' ? cur : null;
  })();

  return (
    <div className="max-w-xl space-y-4">
      {/* 商品名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">商品名称</label>
        <input type="text" required maxLength={255}
          value={basic.name} onChange={(e) => updateBasic({ name: e.target.value })}
          placeholder="如：波点连衣裙"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input type="text" required maxLength={255}
          value={basic.slug} onChange={(e) => updateBasic({ slug: e.target.value })}
          placeholder="如：polka-dot-dress"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>

      {/* 描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">描述</label>
        <textarea rows={3}
          value={basic.description} onChange={(e) => updateBasic({ description: e.target.value })}
          placeholder="商品描述..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>

      {/* 分类 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">分类</label>
        <select value={basic.category_id ?? ''}
          onChange={(e) => updateBasic({ category_id: e.target.value ? Number(e.target.value) : null })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none">
          <option value="">请选择分类</option>
          {categories.map((cat) =>
            cat.children && cat.children.length > 0 ? (
              <optgroup key={cat.id} label={cat.name}>
                {cat.children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </optgroup>
            ) : (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            )
          )}
          {currentInactive && (
            <option value={currentInactive.id}>{currentInactive.name}（已停用）</option>
          )}
        </select>
      </div>

      {/* 价格 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">原价 (USD)</label>
          <input type="number" required min={0} step="0.01"
            value={basic.base_price} onChange={(e) => updateBasic({ base_price: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">售价 (USD)</label>
          <input type="number" min={0} step="0.01"
            value={basic.sale_price ?? ''} onChange={(e) => updateBasic({ sale_price: e.target.value ? Number(e.target.value) : null })}
            placeholder="选填"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">成本价 (USD)</label>
          <input type="number" min={0} step="0.01"
            value={basic.cost_price ?? ''} onChange={(e) => updateBasic({ cost_price: e.target.value ? Number(e.target.value) : null })}
            placeholder="选填"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
        </div>
      </div>

      {/* 状态 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">状态</label>
        <div className="mt-1 flex items-center gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button key={s.key} type="button" onClick={() => updateBasic({ status: s.key })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                basic.status === s.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 排序 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">排序</label>
        <input type="number" min={0}
          value={basic.sort} onChange={(e) => updateBasic({ sort: Number(e.target.value) })}
          className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>
    </div>
  );
}
