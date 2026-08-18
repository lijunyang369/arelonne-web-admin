/**
 * 分类管理 — 桌面端两级树形列表。
 * 根分类为分组头(名称 + 子分类数 + 操作);子分类行缩进,
 * 左侧 1px 竖线 + 短横连接线画出层级关系;停用行降饱和。
 */

import type { CategoryNode } from '@/lib/api/categories';

interface CategoryTreeProps {
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
    <div className="inline-flex items-center gap-0.5 whitespace-nowrap">
      <button type="button" onClick={() => onEdit(cat)}
        className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
        编辑
      </button>
      <button type="button" onClick={() => onToggleStatus(cat)}
        className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
        {cat.status === 'active' ? '停用' : '启用'}
      </button>
      {deletingId === cat.id ? (
        <>
          <button type="button" onClick={() => onConfirmDelete(cat.id)}
            className="rounded px-1.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
            确认
          </button>
          <button type="button" onClick={onCancelDelete}
            className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100">
            取消
          </button>
        </>
      ) : (
        <button type="button" onClick={() => onRequestDelete(cat.id)}
          className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500">
          删除
        </button>
      )}
    </div>
  );
}

export function CategoryTree({
  items, loading, emptyText, deletingId,
  onAddChild, onEdit, onToggleStatus, onRequestDelete, onConfirmDelete, onCancelDelete,
}: CategoryTreeProps) {
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
    <div className="rounded-lg border border-gray-200 bg-white">
      {items.map((root) => {
        const children = root.children ?? [];
        const inactive = root.status === 'inactive';
        return (
          <div key={root.id} className="border-b border-gray-100 last:border-b-0">
            {/* 分组头:根分类 */}
            <div className={`flex items-center gap-3 px-4 py-3 ${inactive ? 'bg-gray-50/60' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate text-sm ${inactive ? 'text-gray-400' : 'font-semibold text-gray-900'}`}>
                    {root.name}
                  </span>
                  {inactive && (
                    <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">已停用</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  <code className="font-mono">{root.slug}</code>
                  <span className="mx-1.5 text-gray-300">·</span>
                  {children.length} 个子分类
                </p>
              </div>
              <StatusDot status={root.status} />
              <button type="button" onClick={() => onAddChild(root)}
                className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                添加子分类
              </button>
              <RowActions
                cat={root} deletingId={deletingId}
                onEdit={onEdit} onToggleStatus={onToggleStatus}
                onRequestDelete={onRequestDelete} onConfirmDelete={onConfirmDelete} onCancelDelete={onCancelDelete}
              />
            </div>

            {/* 子分类区:左侧 1px 竖线(从首行短横延伸到末行) */}
            {children.length > 0 && (
              <div className="relative ml-4">
                <span aria-hidden className="absolute bottom-[18px] left-0 top-[18px] w-px bg-gray-200" />
                {children.map((child) => {
                  const childInactive = child.status === 'inactive';
                  return (
                    <div key={child.id} className="relative flex items-center gap-3 py-2 pl-4 pr-4">
                      {/* 短横连接线:与左侧竖线相接 */}
                      <span aria-hidden className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-gray-200" />
                      <span className={`w-44 truncate text-sm ${childInactive ? 'text-gray-400' : 'font-medium text-gray-900'}`}>
                        {child.name}
                      </span>
                      <code className="w-44 truncate font-mono text-xs text-gray-400">{child.slug}</code>
                      <span className="w-10 flex-shrink-0 text-xs text-gray-400">sort {child.sort}</span>
                      <StatusDot status={child.status} />
                      {childInactive && (
                        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">已停用</span>
                      )}
                      <div className="ml-auto">
                        <RowActions
                          cat={child} deletingId={deletingId}
                          onEdit={onEdit} onToggleStatus={onToggleStatus}
                          onRequestDelete={onRequestDelete} onConfirmDelete={onConfirmDelete} onCancelDelete={onCancelDelete}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
