/**
 * 尺码管理 — 新建/编辑模态框(白卡 max-w-sm + 遮罩 + 红色错误条)。
 */

import type { SizeOptionFormData } from './types';

interface SizeOptionFormModalProps {
  open: boolean;
  editingId: number | null;
  form: SizeOptionFormData;
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (form: SizeOptionFormData) => void;
}

export function SizeOptionFormModal({
  open, editingId, form, saving, formError,
  onClose, onSubmit, onFormChange,
}: SizeOptionFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="mb-5 text-base font-semibold text-gray-900">
          {editingId !== null ? '编辑尺码' : '添加尺码'}
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
              placeholder="如：XS"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">排序</label>
            <input
              type="number" min={0}
              value={form.sort} onChange={(e) => onFormChange({ ...form, sort: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
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
