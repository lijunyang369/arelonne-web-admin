/**
 * 颜色管理 — 桌面端 Table 列定义。
 */

import type { Column } from '@/components/shared/Table';
import type { AdminColor } from '@/lib/api/colors';

/** 格式化 ISO 日期为简短本地格式 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function makeColumns(opts: {
  onEdit: (c: AdminColor) => void;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  deletingId: number | null;
}): Column<AdminColor>[] {
  const { onEdit, onRequestDelete, onConfirmDelete, onCancelDelete, deletingId } = opts;
  return [
    {
      key: 'id', title: 'ID', width: '60px', align: 'center',
      render: (c) => <span className="text-xs text-gray-400">{c.id}</span>,
    },
    {
      key: 'name', title: '英文名称',
      render: (c) => <span className="text-sm font-medium text-gray-900">{c.name}</span>,
    },
    {
      key: 'name_zh', title: '中文名称',
      render: (c) => <span className="text-sm text-gray-600">{c.name_zh || '—'}</span>,
    },
    {
      key: 'swatch', title: '色块', width: '72px', align: 'center',
      render: (c) => (
        <div
          className="inline-block h-8 w-8 rounded-full border border-gray-200 align-middle"
          style={{ backgroundColor: c.hex }} title={c.hex}
        />
      ),
    },
    {
      key: 'hex', title: 'Hex', className: 'hidden sm:table-cell', align: 'center',
      render: (c) => <code className="whitespace-nowrap text-xs text-gray-400">{c.hex}</code>,
    },
    {
      key: 'status', title: '状态', align: 'center',
      render: (c) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {c.status === 'active' ? '活跃' : '停用'}
        </span>
      ),
    },
    {
      key: 'meta', title: '更新信息', className: 'hidden lg:table-cell', align: 'center', width: '200px',
      render: (c) => (
        <span className="whitespace-nowrap text-xs text-gray-400">
          {c.updated_at && <span>{formatDate(c.updated_at)}</span>}
          {c.updated_at && c.updated_by && <span className="mx-1">·</span>}
          {c.updated_by && <span>{c.updated_by}</span>}
        </span>
      ),
    },
    {
      key: 'actions', title: '操作', className: 'whitespace-nowrap', align: 'center', width: '130px',
      render: (c) => (
        <div className="inline-flex items-center gap-0.5 whitespace-nowrap">
          <button type="button" onClick={() => onEdit(c)}
            className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            编辑
          </button>
          {deletingId === c.id ? (
            <>
              <button type="button" onClick={() => onConfirmDelete(c.id)}
                className="rounded px-1.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
                确认
              </button>
              <button type="button" onClick={onCancelDelete}
                className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100">
                取消
              </button>
            </>
          ) : (
            <button type="button" onClick={() => onRequestDelete(c.id)}
              className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500">
              删除
            </button>
          )}
        </div>
      ),
    },
  ];
}
