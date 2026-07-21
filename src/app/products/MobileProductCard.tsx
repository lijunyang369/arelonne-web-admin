/**
 * 商品管理 — 移动端卡片列表 + 简化分页。
 */

import type { AdminProduct } from '@/lib/api/products';
import { formatDate } from './columns';

/** 获取列表主图 URL */
function getPrimaryImage(images: AdminProduct['images']): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.is_primary);
  return primary?.url ?? images[0]?.url ?? null;
}

interface MobileProductCardProps {
  items: AdminProduct[];
  loading: boolean;
  emptyText: string;
  deletingId: number | null;
  page: number;
  pageSize: number;
  total: number;
  onEdit: (id: number) => void;
  onRowClick: (id: number) => void;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  onPageChange: (page: number, pageSize: number) => void;
}

export function MobileProductCard({
  items, loading, emptyText, deletingId,
  page, pageSize, total,
  onEdit, onRowClick, onRequestDelete, onConfirmDelete, onCancelDelete, onPageChange,
}: MobileProductCardProps) {
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
      {items.map((p) => {
        const img = getPrimaryImage(p.images);
        const statusMap: Record<string, { label: string; cls: string }> = {
          active: { label: '在售', cls: 'bg-green-50 text-green-700' },
          draft: { label: '草稿', cls: 'bg-gray-100 text-gray-500' },
          inactive: { label: '下架', cls: 'bg-red-50 text-red-600' },
        };
        const s = statusMap[p.status] || statusMap.draft;

        return (
          <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer"
            onClick={() => onRowClick(p.id)}>
            {/* 第一行：图片 · 名称 · 状态 */}
            <div className="flex items-center gap-3">
              {img
                ? <img src={img} alt={p.name} className="h-12 w-12 flex-shrink-0 rounded object-cover" />
                : <div className="h-12 w-12 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-300">无</div>
              }
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                <p className="truncate text-xs text-gray-400">{p.category?.name || '—'} · ${Number(p.base_price).toFixed(2)}</p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                {s.label}
              </span>
            </div>

            {/* 第二行：创建时间 */}
            <div className="mt-2 text-xs text-gray-400">
              {formatDate(p.created_at)}
            </div>

            {/* 第三行：操作按钮 */}
            <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-2"
              onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => onEdit(p.id)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50">
                编辑
              </button>
              {deletingId === p.id ? (
                <>
                  <button type="button" onClick={() => onConfirmDelete(p.id)}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100">
                    确认删除
                  </button>
                  <button type="button" onClick={onCancelDelete}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50">
                    取消
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => onRequestDelete(p.id)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50">
                  删除
                </button>
              )}
            </div>
          </div>
        );
      })}

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
