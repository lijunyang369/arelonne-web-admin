/**
 * 分类管理 — 新建/编辑模态框。
 * 新建:名称 + slug(自动生成可改)+ 上级分类 + 排序 + 状态
 * 编辑:同字段,slug 只读展示(创建后锁定,后端 prohibited)
 */

import type { CategoryNode } from '@/lib/api/categories';
import type { CategoryFormData } from './types';

interface CategoryFormModalProps {
  open: boolean;
  editingId: number | null;
  /** 根分类列表(上级分类下拉数据源,两级限制) */
  roots: CategoryNode[];
  form: CategoryFormData;
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (form: CategoryFormData) => void;
  /** slug 输入被手动编辑时回调(停止自动生成) */
  onSlugEdited: () => void;
}

export function CategoryFormModal({
  open, editingId, roots, form, saving, formError,
  onClose, onSubmit, onFormChange, onSlugEdited,
}: CategoryFormModalProps) {
  if (!open) return null;

  // 编辑态排除自身(防自环);下拉只列根分类(两级不变量)
  const parentOptions = editingId !== null ? roots.filter((r) => r.id !== editingId) : roots;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="mb-5 text-base font-semibold text-gray-900">
          {editingId !== null ? '编辑分类' : '添加分类'}
        </h2>
        {formError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">名称</label>
            <input
              type="text" required maxLength={255}
              value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="如：连衣裙"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            {editingId !== null ? (
              <>
                <input
                  type="text" readOnly value={form.slug}
                  className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 shadow-sm"
                />
                <p className="mt-1 text-xs text-gray-400">创建后不可修改</p>
              </>
            ) : (
              <>
                <input
                  type="text" maxLength={255}
                  value={form.slug}
                  onChange={(e) => { onSlugEdited(); onFormChange({ ...form, slug: e.target.value }); }}
                  placeholder="如：dresses（留空自动按名称生成）"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">留空将按名称自动生成</p>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">上级分类</label>
            <select
              value={form.parent_id}
              onChange={(e) => onFormChange({ ...form, parent_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            >
              <option value="">无（根分类）</option>
              {parentOptions.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">排序</label>
            <input
              type="number" min={0}
              value={form.sort} onChange={(e) => onFormChange({ ...form, sort: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <select
              value={form.status}
              onChange={(e) => onFormChange({ ...form, status: e.target.value as 'active' | 'inactive' })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            >
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100">
              取消
            </button>
            <button type="submit" disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
              {saving ? '保存中...' : editingId !== null ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
