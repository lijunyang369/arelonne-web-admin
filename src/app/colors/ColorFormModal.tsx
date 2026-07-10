/**
 * 颜色管理 — 新建/编辑模态框。
 */

import type { ColorFormData } from './types';

interface ColorFormModalProps {
  open: boolean;
  editingId: number | null;
  form: ColorFormData;
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (form: ColorFormData) => void;
}

export function ColorFormModal({
  open, editingId, form, saving, formError,
  onClose, onSubmit, onFormChange,
}: ColorFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="mb-5 text-base font-semibold text-gray-900">
          {editingId !== null ? '编辑颜色' : '添加颜色'}
        </h2>
        {formError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">英文名称</label>
            <input
              type="text" required maxLength={255}
              value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="如：Scarlet Red"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">中文名称</label>
            <input
              type="text" maxLength={255}
              value={form.name_zh} onChange={(e) => onFormChange({ ...form, name_zh: e.target.value })}
              placeholder="如：猩红"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">色值</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text" required pattern="#[0-9A-Fa-f]{6}" maxLength={7}
                value={form.hex} onChange={(e) => onFormChange({ ...form, hex: e.target.value })}
                placeholder="#RRGGBB"
                className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-gray-900 focus:outline-none"
              />
              <input
                type="color" value={form.hex}
                onChange={(e) => onFormChange({ ...form, hex: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border border-gray-300" title="取色器"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <select
              value={form.status}
              onChange={(e) => onFormChange({ ...form, status: e.target.value })}
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
