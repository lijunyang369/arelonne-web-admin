'use client';

/**
 * 尺码管理页 — 状态编排层。
 * 数据/CRUD/排序 → useSizeOptionList
 * 桌面端表格   → 行内简单表格(名称 / 排序值 / 操作)
 * 移动端卡片   → 行内卡片列表
 * 新建/编辑模态框 → SizeOptionFormModal
 */

import type { SizeOption } from '@/lib/api/sizeOptions';
import { useSizeOptionList } from './useSizeOptionList';
import { SizeOptionFormModal } from './SizeOptionFormModal';

/** 行操作按钮组(上移/下移/编辑/删除;删除带行内二次确认) */
function RowActions({
  opt, index, total, moving, deleting,
  onMove, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete,
}: {
  opt: SizeOption;
  index: number;
  total: number;
  moving: boolean;
  deleting: boolean;
  onMove: (index: number, dir: -1 | 1) => void;
  onEdit: (opt: SizeOption) => void;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
}) {
  const btn = 'rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400';

  return (
    <div className="inline-flex items-center gap-0.5 whitespace-nowrap">
      <button type="button" title="上移" disabled={moving || index === 0}
        onClick={() => onMove(index, -1)} className={btn}>上移</button>
      <button type="button" title="下移" disabled={moving || index === total - 1}
        onClick={() => onMove(index, 1)} className={btn}>下移</button>
      <button type="button" onClick={() => onEdit(opt)}
        className={btn}>编辑</button>
      {deleting ? (
        <>
          <button type="button" onClick={() => onConfirmDelete(opt.id)}
            className="rounded px-1.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
            确认
          </button>
          <button type="button" onClick={onCancelDelete}
            className={btn}>取消</button>
        </>
      ) : (
        <button type="button" onClick={() => onRequestDelete(opt.id)}
          className="rounded px-1.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500">
          删除
        </button>
      )}
    </div>
  );
}

export default function SizeOptionsPage() {
  const {
    items, loading, error,
    modalOpen, editingId, form, saving, formError,
    openCreate, openEdit, closeModal, handleSubmit, setForm,
    movingId, handleMove,
    deletingId, handleDelete, setDeletingId,
  } = useSizeOptionList();

  const emptyText = '暂无尺码，点击「添加尺码」创建';

  // 操作按钮组公共参数
  const actionsProps = {
    moving: movingId !== null,
    onMove: handleMove,
    onEdit: openEdit,
    onRequestDelete: (id: number) => setDeletingId(id),
    onConfirmDelete: (id: number) => handleDelete(id),
    onCancelDelete: () => setDeletingId(null),
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">尺码管理</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* 操作栏 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-400">共 {items.length} 个尺码</p>
        <button type="button" onClick={openCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
          添加尺码
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
          {emptyText}
        </div>
      ) : (
        <>
          {/* 桌面端表格 */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">排序值</th>
                  <th className="px-4 py-3 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((opt, i) => (
                  <tr key={opt.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{opt.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{opt.sort}</td>
                    <td className="px-4 py-3 text-center">
                      <RowActions
                        {...actionsProps}
                        opt={opt} index={i} total={items.length}
                        deleting={deletingId === opt.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片 */}
          <div className="space-y-2 md:hidden">
            {items.map((opt, i) => (
              <div key={opt.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{opt.name}</p>
                  <span className="text-xs text-gray-400">排序 {opt.sort}</span>
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-gray-100 pt-2">
                  <RowActions
                    {...actionsProps}
                    opt={opt} index={i} total={items.length}
                    deleting={deletingId === opt.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 模态框 */}
      <SizeOptionFormModal
        open={modalOpen} editingId={editingId} form={form}
        saving={saving} formError={formError}
        onClose={closeModal} onSubmit={handleSubmit}
        onFormChange={setForm}
      />
    </div>
  );
}
