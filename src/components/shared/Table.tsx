'use client';

/**
 * 通用数据表格组件 — 基于原生 HTML `<table>`。
 *
 * ```tsx
 * <Table
 *   columns={[
 *     { key: 'name', title: '名称' },
 *     { key: 'status', title: '状态', render: (item) => <Badge /> },
 *   ]}
 *   data={items}
 *   keyExtractor={(item) => item.id}
 * />
 * ```
 */

import { useState, useMemo, useEffect } from 'react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ============================================================================
// 类型
// ============================================================================

export interface Column<T> {
  key: string;
  title: string | React.ReactNode;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  /** 固定列宽（如 '60px'），通过 <colgroup> 强制生效 */
  width?: string;
}

/** 共享 props */
interface TableBase<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (item: T) => void;
}

/** 服务端分页：父组件完全受控 */
interface TableServer<T> extends TableBase<T> {
  total: number;
  currentPage: number;
  currentPageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  pageSize?: never;
}

/** 客户端分页：组件内部 slice */
interface TableClient<T> extends TableBase<T> {
  total?: never;
  currentPage?: never;
  currentPageSize?: never;
  onPageChange?: never;
  pageSize?: number; // 默认 20
}

export type TableProps<T> = TableServer<T> | TableClient<T>;

// ============================================================================
// 分页
// ============================================================================

function Pagination({
  current,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  current: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  const pages = useMemo(() => {
    const result: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      result.push(1);
      if (current > 3) result.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
        result.push(i);
      }
      if (current < totalPages - 2) result.push('...');
      result.push(totalPages);
    }
    return result;
  }, [current, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3">
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>{total === 0 ? '无数据' : `${start}-${end} / 共 ${total} 条`}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s} 条/页</option>
          ))}
        </select>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-0.5">
          <button type="button" disabled={current === 1} onClick={() => onPage(current - 1)}
            className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">
            上一页
          </button>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} className="px-1 text-xs text-gray-300">...</span>
            ) : (
              <button key={p} type="button" onClick={() => onPage(p)}
                className={`h-7 min-w-[28px] rounded px-1.5 text-xs font-medium transition-colors ${
                  p === current ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {p}
              </button>
            ),
          )}
          <button type="button" disabled={current === totalPages} onClick={() => onPage(current + 1)}
            className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 表格
// ============================================================================

export function Table<T>({
  columns,
  data,
  keyExtractor,
  pageSize: defaultPageSize = 20,
  total: totalProp,
  onPageChange,
  onRowClick,
  currentPage,
  currentPageSize,
  loading = false,
  emptyText = '暂无数据',
}: TableProps<T>) {
  // 客户端分页内部状态
  const [internalPage, setInternalPage] = useState(1);
  const [internalSize, setInternalSize] = useState(defaultPageSize);
  const serverSide = totalProp !== undefined;

  // 服务端模式：完全受控；客户端模式：内部状态
  const page = serverSide ? (currentPage ?? 1) : internalPage;
  const size = serverSide ? (currentPageSize ?? defaultPageSize) : internalSize;

  // 客户端模式：数据源变化回第一页
  useEffect(() => {
    if (!serverSide) setInternalPage(1);
  }, [data, serverSide]);

  /** 客户端分页：截取当前页数据 */
  const paged = useMemo(() => {
    if (serverSide) return data;
    const start = (page - 1) * size;
    return data.slice(start, start + size);
  }, [data, page, size, serverSide]);

  /** 分页变化 */
  const handlePageChange = (p: number) => {
    if (!serverSide) setInternalPage(p);
    onPageChange?.(p, size);
  };
  const handlePageSizeChange = (s: number) => {
    if (!serverSide) { setInternalSize(s); setInternalPage(1); }
    onPageChange?.(1, s);
  };

  const totalItems = serverSide ? totalProp : data.length;

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <p className="px-5 py-12 text-center text-sm text-gray-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
      <table className="w-full border-collapse table-fixed">
        {/* ======== 列宽定义 ======== */}
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>

        {/* ======== 标题 ======== */}
        <thead>
          <tr className="bg-gray-50/50">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ textAlign: col.align || 'left' }}
                className={`whitespace-nowrap border-b border-r border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 last:border-r-0 sm:px-4 sm:py-2 ${col.className || ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>

        {/* ======== 数据 ======== */}
        <tbody>
          {paged.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            paged.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={`transition-colors hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ textAlign: col.align || 'left' }}
                    className={`whitespace-nowrap border-b border-r border-gray-200 px-3 py-2 text-sm last:border-r-0 sm:px-4 sm:py-2 ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(item)
                      : (
                        <span className="text-sm text-gray-900">
                          {String((item as Record<string, unknown>)[col.key] ?? '')}
                        </span>
                      )
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        current={page} total={totalItems} pageSize={size}
        onPage={handlePageChange}
        onPageSize={handlePageSizeChange}
      />
    </div>
  );
}
