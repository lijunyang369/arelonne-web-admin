'use client';

/**
 * 品类管理页 — 状态编排层。
 * 数据/CRUD   → useCategoryList
 * 桌面树形列表 → CategoryTree(两级 + 层级连接线)
 * 移动端卡片   → MobileCategoryCard
 * 新建/编辑模态框 → CategoryFormModal
 */

import { useCategoryList } from './useCategoryList';
import { CategoryTree } from './CategoryTree';
import { MobileCategoryCard } from './MobileCategoryCard';
import { CategoryFormModal } from './CategoryFormModal';

export default function CategoriesPage() {
  const {
    items, loading, error,
    modalOpen, editingId, form, saving, formError,
    openCreate, openAddChild, openEdit, closeModal, handleSubmit, handleFormChange, setSlugTouched,
    handleToggleStatus,
    deletingId, handleDelete, setDeletingId,
  } = useCategoryList();

  // 根分类列表(上级分类下拉数据源)
  const roots = items;

  // 总数(根 + 子),用于操作栏左侧的安静提示
  const totalCount = items.reduce((n, r) => n + 1 + (r.children?.length ?? 0), 0);

  const emptyText = '暂无分类，点击「添加分类」创建';

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">品类管理</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* 操作栏 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-400">共 {totalCount} 个分类 · 最多两级</p>
        <button type="button" onClick={openCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
          添加分类
        </button>
      </div>

      {/* 桌面端树形列表 */}
      <div className="hidden md:block">
        <CategoryTree
          items={items} loading={loading} emptyText={emptyText} deletingId={deletingId}
          onAddChild={openAddChild}
          onEdit={openEdit}
          onToggleStatus={handleToggleStatus}
          onRequestDelete={(id) => setDeletingId(id)}
          onConfirmDelete={(id) => handleDelete(id)}
          onCancelDelete={() => setDeletingId(null)}
        />
      </div>

      {/* 移动端卡片 */}
      <div className="md:hidden">
        <MobileCategoryCard
          items={items} loading={loading} emptyText={emptyText} deletingId={deletingId}
          onAddChild={openAddChild}
          onEdit={openEdit}
          onToggleStatus={handleToggleStatus}
          onRequestDelete={(id) => setDeletingId(id)}
          onConfirmDelete={(id) => handleDelete(id)}
          onCancelDelete={() => setDeletingId(null)}
        />
      </div>

      {/* 模态框 */}
      <CategoryFormModal
        open={modalOpen} editingId={editingId} roots={roots}
        form={form} saving={saving} formError={formError}
        onClose={closeModal} onSubmit={handleSubmit}
        onFormChange={handleFormChange} onSlugEdited={() => setSlugTouched(true)}
      />
    </div>
  );
}
