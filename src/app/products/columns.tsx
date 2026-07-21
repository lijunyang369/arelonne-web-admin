/**
 * 商品管理 — 桌面端 Table 列定义。
 */

import type { Column } from '@/components/shared/Table';
import type { AdminProduct } from '@/lib/api/products';

/** 格式化 ISO 日期为简短本地格式 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 获取列表主图 URL */
function getPrimaryImage(images: AdminProduct['images']): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.is_primary);
  return primary?.url ?? images[0]?.url ?? null;
}

interface MakeColumnsOpts {
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  onEdit: (id: number) => void;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  deletingId: number | null;
  /** 行点击 → 进入详情编辑页 */
  onRowClick: (id: number) => void;
}

export function makeColumns(opts: MakeColumnsOpts): Column<AdminProduct>[] {
  const {
    selectedIds, onToggleSelect, onToggleSelectAll, allSelected,
    onEdit, onRequestDelete, onConfirmDelete, onCancelDelete, deletingId,
  } = opts;

  return [
    {
      key: 'checkbox', title: (
        <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300" />
      ), width: '40px', align: 'center',
      render: (p) => (
        <input type="checkbox" checked={selectedIds.has(p.id)}
          onChange={() => onToggleSelect(p.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300" />
      ),
    },
    {
      key: 'image', title: '图片', width: '64px', align: 'center',
      render: (p) => {
        const img = getPrimaryImage(p.images);
        return img
          ? <img src={img} alt={p.name} className="mx-auto h-10 w-10 rounded object-cover" />
          : <div className="mx-auto h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-300">无</div>;
      },
    },
    {
      key: 'name', title: '商品名称',
      render: (p) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{p.name}</p>
          <p className="text-xs text-gray-400">{p.slug}</p>
        </div>
      ),
    },
    {
      key: 'category', title: '分类', width: '120px',
      render: (p) => <span className="text-sm text-gray-600">{p.category?.name || '—'}</span>,
    },
    {
      key: 'price', title: '价格', width: '120px', align: 'right',
      render: (p) => (
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">${Number(p.sale_price || p.base_price).toFixed(2)}</p>
          {p.sale_price && (
            <p className="text-xs text-gray-400 line-through">${Number(p.base_price).toFixed(2)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status', title: '状态', width: '80px', align: 'center',
      render: (p) => {
        const map: Record<string, { label: string; cls: string }> = {
          active: { label: '在售', cls: 'bg-green-50 text-green-700' },
          draft: { label: '草稿', cls: 'bg-gray-100 text-gray-500' },
          inactive: { label: '下架', cls: 'bg-red-50 text-red-600' },
        };
        const s = map[p.status] || map.draft;
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
      },
    },
    {
      key: 'created_at', title: '更新信息', className: 'hidden lg:table-cell', align: 'center', width: '200px',
      render: (p) => (
        <span className="whitespace-nowrap text-xs text-gray-400">
          {p.created_at && <span>{formatDate(p.created_at)}</span>}
        </span>
      ),
    },
    {
      key: 'actions', title: '操作', className: 'whitespace-nowrap', align: 'center', width: '100px',
      render: (p) => (
        <div className="inline-flex items-center gap-0.5 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onEdit(p.id)}
            className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            编辑
          </button>
          {deletingId === p.id ? (
            <>
              <button type="button" onClick={() => onConfirmDelete(p.id)}
                className="rounded px-1.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
                确认
              </button>
              <button type="button" onClick={onCancelDelete}
                className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100">
                取消
              </button>
            </>
          ) : (
            <button type="button" onClick={() => onRequestDelete(p.id)}
              className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500">
              删除
            </button>
          )}
        </div>
      ),
    },
  ];
}

export { formatDate };
