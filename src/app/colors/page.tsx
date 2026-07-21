'use client';

/**
 * 品牌颜色管理页 — 状态编排层。
 * 数据/分页/CRUD → useColors hook
 * 桌面表格列定义   → makeColumns()
 * 移动端卡片列表   → MobileColorCard
 * 新建/编辑模态框  → ColorFormModal
 */

import { useColorList } from './useColorList';
import { makeColumns } from './columns';
import { MobileColorCard } from './MobileColorCard';
import { ColorFormModal } from './ColorFormModal';
import { Table } from '@/components/shared/Table';

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'active', label: '活跃' },
  { key: 'inactive', label: '停用' },
];

export default function ColorsPage() {
  const {
    items, total, page, pageSize, loading, error, statusFilter,
    setStatusFilter, handlePageChange,
    modalOpen, editingId, form, saving, formError,
    openCreate, openEdit, closeModal, handleSubmit, setForm,
    deletingId, handleDelete, setDeletingId,
  } = useColorList();

  const columns = makeColumns({
    onEdit: openEdit,
    onRequestDelete: (id) => setDeletingId(id),
    onConfirmDelete: (id) => handleDelete(id),
    onCancelDelete: () => setDeletingId(null),
    deletingId,
  });

  const emptyText = statusFilter ? '暂无该状态的颜色' : '暂无颜色，点击「添加颜色」创建';

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">颜色管理</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* 操作栏 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {STATUS_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setStatusFilter(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={openCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
          添加颜色
        </button>
      </div>

      {/* 桌面端表格 */}
      <div className="hidden md:block">
        <Table
          columns={columns} data={items} total={total}
          currentPage={page} currentPageSize={pageSize}
          onPageChange={handlePageChange} keyExtractor={(c) => c.id}
          loading={loading} emptyText={emptyText}
        />
      </div>

      {/* 移动端卡片 */}
      <div className="md:hidden">
        <MobileColorCard
          items={items} loading={loading} emptyText={emptyText}
          deletingId={deletingId} page={page} pageSize={pageSize} total={total}
          onEdit={openEdit}
          onRequestDelete={(id) => setDeletingId(id)}
          onConfirmDelete={(id) => handleDelete(id)}
          onCancelDelete={() => setDeletingId(null)}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 模态框 */}
      <ColorFormModal
        open={modalOpen} editingId={editingId} form={form}
        saving={saving} formError={formError}
        onClose={closeModal} onSubmit={handleSubmit}
        onFormChange={setForm}
      />
    </div>
  );
}
