/**
 * 颜色管理 — 移动端卡片列表 + 简化分页。
 */

import type { AdminColor } from '@/lib/api/colors';
import { formatDate } from './columns';

interface MobileColorCardProps {
  items: AdminColor[];
  loading: boolean;
  emptyText: string;
  deletingId: number | null;
  page: number;
  pageSize: number;
  total: number;
  onEdit: (c: AdminColor) => void;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  onPageChange: (page: number, pageSize: number) => void;
}

export function MobileColorCard({
  items, loading, emptyText, deletingId,
  page, pageSize, total, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete, onPageChange,
}: MobileColorCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
        加载中...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-2">
      {items.map((c) => (
        <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
          {/* 第一行：色块 · 名称 · 状态 */}
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 flex-shrink-0 rounded-full border border-gray-200"
              style={{ backgroundColor: c.hex }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {c.name_zh || c.name}
              </p>
              {c.name_zh && <p className="truncate text-xs text-gray-400">{c.name}</p>}
            </div>
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {c.status === 'active' ? '活跃' : '停用'}
            </span>
          </div>

          {/* 第二行：Hex · 更新信息 */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <code className="flex-shrink-0">{c.hex}</code>
            {c.updated_at && (
              <span className="truncate">
                {formatDate(c.updated_at)}
                {c.updated_by && <> · {c.updated_by}</>}
              </span>
            )}
          </div>

          {/* 第三行：操作按钮 */}
          <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-2">
            <button type="button" onClick={() => onEdit(c)}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50">
              编辑
            </button>
            {deletingId === c.id ? (
              <>
                <button type="button" onClick={() => onConfirmDelete(c.id)}
                  className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100">
                  确认删除
                </button>
                <button type="button" onClick={onCancelDelete}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50">
                  取消
                </button>
              </>
            ) : (
              <button type="button" onClick={() => onRequestDelete(c.id)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50">
                删除
              </button>
            )}
          </div>
        </div>
      ))}

      {/* 移动端简化分页 */}
      {total > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <button type="button" disabled={page <= 1}
            onClick={() => onPageChange(page - 1, pageSize)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-30">
            上一页
          </button>
          <span className="text-xs text-gray-400">{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1, pageSize)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-30">
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
