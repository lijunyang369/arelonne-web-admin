/**
 * 分类管理 — 移动端简化卡片。
 * 每个根分类一张卡片:头部(名称 + 状态)+ 子分类行(短横连接线)
 * + 底部操作栏(添加子分类/编辑/停用启用/删除,删除含行内二次确认)。
 */

import type { CategoryNode } from '@/lib/api/categories';

interface MobileCategoryCardProps {
  items: CategoryNode[];
  loading: boolean;
  emptyText: string;
  deletingId: number | null;
  onAddChild: (root: CategoryNode) => void;
  onEdit: (cat: CategoryNode) => void;
  onToggleStatus: (cat: CategoryNode) => void;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
}

/** 状态点:绿=active、灰=inactive */
function StatusDot({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
  );
}

/** 行操作按钮组(编辑/停用启用/删除,删除含行内二次确认) */
function RowActions({ cat, deletingId, onEdit, onToggleStatus, onRequestDelete, onConfirmDelete, onCancelDelete }: {
  cat: CategoryNode;
  deletingId: number | null;
  onEdit: (cat: CategoryNode) => void;
  onToggleStatus: (cat: CategoryNode) => void;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onEdit(cat)}
        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50">
        编辑
      </button>
      <button type="button" onClick={() => onToggleStatus(cat)}
        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50">
        {cat.status === 'active' ? '停用' : '启用'}
      </button>
      {deletingId === cat.id ? (
        <>
          <button type="button" onClick={() => onConfirmDelete(cat.id)}
            className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100">
            确认删除
          </button>
          <button type="button" onClick={onCancelDelete}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50">
            取消
          </button>
        </>
      ) : (
        <button type="button" onClick={() => onRequestDelete(cat.id)}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50">
          删除
        </button>
      )}
    </div>
  );
}

export function MobileCategoryCard({
  items, loading, emptyText, deletingId,
  onAddChild, onEdit, onToggleStatus, onRequestDelete, onConfirmDelete, onCancelDelete,
}: MobileCategoryCardProps) {
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

  return (
    <div className="space-y-2">
      {items.map((root) => {
        const children = root.children ?? [];
        const inactive = root.status === 'inactive';
        return (
          <div key={root.id} className="rounded-lg border border-gray-200 bg-white p-4">
            {/* 头部:名称 + 状态 */}
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${inactive ? 'text-gray-400' : 'text-gray-900'}`}>
                  {root.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {root.slug} · {children.length} 个子分类
                </p>
              </div>
              <StatusDot status={root.status} />
              {inactive && (
                <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">已停用</span>
              )}
            </div>

            {/* 子分类行:短横连接线 + 名称/slug/sort/状态 */}
            {children.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {children.map((child) => {
                  const childInactive = child.status === 'inactive';
                  return (
                    <div key={child.id} className="flex items-center gap-2">
                      <span aria-hidden className="h-px w-3 flex-shrink-0 bg-gray-200" />
                      <p className={`min-w-0 flex-1 truncate text-sm ${childInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                        {child.name}
                      </p>
                      <StatusDot status={child.status} />
                      {childInactive && (
                        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">已停用</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 操作栏 */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <button type="button" onClick={() => onAddChild(root)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50">
                添加子分类
              </button>
              <RowActions
                cat={root} deletingId={deletingId}
                onEdit={onEdit} onToggleStatus={onToggleStatus}
                onRequestDelete={onRequestDelete} onConfirmDelete={onConfirmDelete} onCancelDelete={onCancelDelete}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
