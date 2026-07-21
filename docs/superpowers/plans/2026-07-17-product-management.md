# 商品管理页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Arelonne 后台商品管理模块 — 列表页（搜索/筛选/批量操作）+ 编辑页（4 Tab：基础信息/颜色图片/SKU变体/扩展信息）

**Architecture:** 完全复用现有 colors 管理页模式：hook 驱动 + 组件纯展示 + 服务端分页 + 共享 Table 组件。列表页 `/products` → 编辑页 `/products/:id`。不引入新依赖。

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS

## Global Constraints

- 后端 Laravel Controller 不写业务逻辑，业务下沉到 Service/Action（已实现，前端无需关心）
- API 响应统一用 API Resource 转换
- 函数必须带中文注释
- 不引入新 npm 依赖
- 所有 UI 样式复用 colors 页既有的 Tailwind class 组合
- 颜色主题：`primary (#4F6EF7)`, `sidebar (#1E1E2D)`, `surface (#F4F5F7)`
- 移动端：`hidden md:block` 显示表格，`md:hidden` 显示卡片列表

---

## File Structure

```
Create:
  src/lib/api/products.ts           — 商品 API 方法 + 响应类型
  src/lib/api/categories.ts         — 分类 API 方法 + 类型
  src/app/products/types.ts         — 前端表单类型
  src/app/products/useProducts.ts   — 列表数据 hook
  src/app/products/columns.tsx      — 桌面端列定义
  src/app/products/MobileProductCard.tsx  — 移动端卡片
  src/app/products/[id]/page.tsx    — 编辑页容器
  src/app/products/[id]/BasicInfoTab.tsx  — Tab 1
  src/app/products/[id]/ImagesTab.tsx     — Tab 2
  src/app/products/[id]/VariantsTab.tsx   — Tab 3
  src/app/products/[id]/MetaTab.tsx       — Tab 4
  src/app/products/[id]/hooks/useProductDetail.ts
  src/app/products/[id]/hooks/useImages.ts
  src/app/products/[id]/hooks/useVariants.ts

Modify:
  src/app/products/page.tsx         — 替换占位内容

Backend (api-admin):
  Create: app/Http/Controllers/Admin/CategoryController.php
  Modify: routes/api.php            — 添加 categories 路由
  Modify: app/Http/Controllers/Admin/ProductController.php  — 添加 category_id 筛选
```

---

### Task 0: 后端 Category API + Product 筛选增强（前置依赖）

**Files:**
- Create: `/var/www/arelonne/api-admin/app/Http/Controllers/Admin/CategoryController.php`
- Modify: `/var/www/arelonne/api-admin/routes/api.php`
- Modify: `/var/www/arelonne/api-admin/app/Http/Controllers/Admin/ProductController.php`

**Produces:**
- `GET /admin/categories` → 分类树列表
- `GET /admin/products?category_id=N` → 按分类筛选

- [ ] **Step 1: 创建 CategoryController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * 获取分类树（含父子关系）。
     */
    public function index(): JsonResponse
    {
        $categories = Category::where('status', 'active')
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        // 构建树形结构：parent_id=null 为根
        $tree = $categories->whereNull('parent_id')->map(function (Category $cat) use ($categories) {
            return [
                'id'       => $cat->id,
                'name'     => $cat->name,
                'slug'     => $cat->slug,
                'children' => $categories->where('parent_id', $cat->id)->map(fn (Category $child) => [
                    'id'   => $child->id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                ])->values()->toArray(),
            ];
        })->values()->toArray();

        return response()->json(['data' => $tree]);
    }
}
```

- [ ] **Step 2: 注册路由**

在 `/var/www/arelonne/api-admin/routes/api.php` 的 `auth:sanctum` 组内添加：

```php
Route::get('categories', [\App\Http\Controllers\Admin\CategoryController::class, 'index']);
```

- [ ] **Step 3: ProductController 添加分类筛选**

在 `ProductController::index` 方法的 `$status` 筛选后添加：

```php
if ($categoryId = $request->get('category_id')) {
    $query->where('category_id', $categoryId);
}
```

- [ ] **Step 4: 验证后端 API**

```bash
# 启动 api-admin 服务后测试
curl -H "Authorization: Bearer <token>" http://localhost:8082/api/admin/categories | jq
curl -H "Authorization: Bearer <token>" "http://localhost:8082/api/admin/products?category_id=1" | jq
```

---

### Task 1: 前端 API 层 + 类型定义

**Files:**
- Create: `src/lib/api/products.ts`
- Create: `src/lib/api/categories.ts`
- Create: `src/app/products/types.ts`

**Produces:** 所有 API 方法和前后端类型，后续 Task 2-8 全部依赖此 Task。

- [ ] **Step 1: 创建商品 API 层**

Write `src/lib/api/products.ts`:

```typescript
/**
 * 商品管理 API 请求。
 */

import { adminFetch } from './client';

// ============================================================================
// 响应类型（对应后端 ProductResource / ProductListResource）
// ============================================================================

export interface AdminProductImage {
  id: number;
  url: string;
  alt: string | null;
  sort: number;
  is_primary: boolean;
}

export interface AdminVariant {
  id: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  image: string | null;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: { id: number; name: string; slug: string } | null;
  base_price: number;
  sale_price: number | null;
  status: 'draft' | 'active' | 'inactive';
  meta: Record<string, unknown> | null;
  images: AdminProductImage[];
  created_at: string;
}

export interface AdminProductDetail extends AdminProduct {
  cost_price: number | null;
  sort: number;
  variants: AdminVariant[];
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ProductListResponse {
  data: AdminProduct[];
  meta: PaginationMeta;
}

interface ProductDetailResponse {
  data: AdminProductDetail;
}

// ============================================================================
// 请求参数
// ============================================================================

export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category_id?: number;
}

export interface ProductCreateData {
  name: string;
  slug: string;
  description?: string;
  category_id: number;
  base_price: number;
  sale_price?: number | null;
  cost_price?: number | null;
  status: 'draft' | 'active' | 'inactive';
  sort?: number;
  meta?: Record<string, unknown> | null;
}

// ============================================================================
// API 方法
// ============================================================================

/** 获取商品列表（服务端分页 + 筛选） */
export async function getProducts(
  token: string,
  params?: ProductListParams,
): Promise<ProductListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.per_page) sp.set('per_page', String(params.per_page));
  if (params?.search) sp.set('search', params.search);
  if (params?.status) sp.set('status', params.status);
  if (params?.category_id) sp.set('category_id', String(params.category_id));
  const qs = sp.toString();
  return adminFetch<ProductListResponse>(`/admin/products${qs ? `?${qs}` : ''}`, token);
}

/** 获取单个商品（含变体和图片） */
export async function getProduct(token: string, id: number): Promise<AdminProductDetail> {
  const res = await adminFetch<ProductDetailResponse>(`/admin/products/${id}`, token);
  return res.data;
}

/** 创建商品 */
export async function createProduct(
  token: string,
  data: ProductCreateData,
): Promise<AdminProductDetail> {
  const res = await adminFetch<ProductDetailResponse>('/admin/products', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

/** 更新商品 */
export async function updateProduct(
  token: string,
  id: number,
  data: Partial<ProductCreateData>,
): Promise<AdminProductDetail> {
  const res = await adminFetch<ProductDetailResponse>(`/admin/products/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

/** 删除商品（软删除） */
export async function deleteProduct(token: string, id: number): Promise<void> {
  await adminFetch<void>(`/admin/products/${id}`, token, { method: 'DELETE' });
}

/** 批量修改状态（逐条调用） */
export async function batchUpdateStatus(
  token: string,
  ids: number[],
  status: string,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await updateProduct(token, id, { status: status as 'draft' | 'active' | 'inactive' });
      success++;
    } catch {
      failed++;
    }
  }
  return { success, failed };
}

/** 批量删除（逐条调用） */
export async function batchDelete(
  token: string,
  ids: number[],
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await deleteProduct(token, id);
      success++;
    } catch {
      failed++;
    }
  }
  return { success, failed };
}
```

- [ ] **Step 2: 创建分类 API 层**

Write `src/lib/api/categories.ts`:

```typescript
/**
 * 分类管理 API 请求。
 */

import { adminFetch } from './client';

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  children: { id: number; name: string; slug: string }[];
}

interface CategoriesResponse {
  data: AdminCategory[];
}

/** 获取分类树 */
export async function getCategories(token: string): Promise<AdminCategory[]> {
  const res = await adminFetch<CategoriesResponse>('/admin/categories', token);
  return res.data;
}
```

- [ ] **Step 3: 创建前端表单类型**

Write `src/app/products/types.ts`:

```typescript
/**
 * 商品管理 — 前端表单类型定义。
 */

/** 商品基础信息 */
export interface ProductBasicInfo {
  name: string;
  slug: string;
  description: string;
  category_id: number | null;
  base_price: number;
  sale_price: number | null;
  cost_price: number | null;
  status: 'draft' | 'active' | 'inactive';
  sort: number;
}

/** 图片项 */
export interface ProductImageItem {
  id?: number;
  url: string;
  alt: string;
  sort: number;
  is_primary: boolean;
}

/** SKC 颜色组（含图片） */
export interface SkcGroup {
  id?: number;
  color: string;
  color_hex: string;
  sort: number;
  images: ProductImageItem[];
  expanded: boolean;        // UI 状态：折叠/展开
}

/** SKU 变体 */
export interface ProductVariantItem {
  id?: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

/** 编辑页完整表单数据 */
export interface ProductFormData {
  basic: ProductBasicInfo;
  skcs: SkcGroup[];
  variants: ProductVariantItem[];
  meta: Record<string, unknown>;
}

/** 商品基础信息默认值 */
export const EMPTY_BASIC: ProductBasicInfo = {
  name: '',
  slug: '',
  description: '',
  category_id: null,
  base_price: 0,
  sale_price: null,
  cost_price: null,
  status: 'draft',
  sort: 0,
};

/** 表单默认值（新建商品） */
export const EMPTY_FORM: ProductFormData = {
  basic: { ...EMPTY_BASIC },
  skcs: [],
  variants: [],
  meta: {},
};

/** 预设尺码列表 */
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
```

- [ ] **Step 4: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/lib/api/products.ts src/lib/api/categories.ts src/app/products/types.ts
git commit -m "feat: add product API layer and types"
```

---

### Task 2: useProducts hook（列表数据 + 批量操作）

**Files:**
- Create: `src/app/products/useProducts.ts`

**Consumes:** `getProducts`, `batchUpdateStatus`, `batchDelete`, `ApiError`, `AdminProduct`, `ProductListParams` from Task 1
**Produces:** `useProducts` hook — list page (Task 3-4) 的数据源

- [ ] **Step 1: 创建 useProducts hook**

Write `src/app/products/useProducts.ts`:

```typescript
/**
 * 商品管理 — 列表数据获取 + 分页 + 筛选 + 批量操作 hook。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts, batchUpdateStatus, batchDelete } from '@/lib/api/products';
import { ApiError } from '@/lib/api/client';
import type { AdminProduct } from '@/lib/api/products';

export function useProducts() {
  // ---- 列表 ----
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- 筛选 ----
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number[]>([]);

  // ---- 批量操作 ----
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // ---- 删除 ----
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 搜索防抖 timer
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const getToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hope_admin_token') || '';
  };

  /** 加载商品列表 */
  const loadProducts = useCallback(async (
    p: number,
    ps: number,
    status: string,
    searchText: string,
    catIds: number[],
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts(getToken(), {
        page: p,
        per_page: ps,
        ...(status ? { status } : {}),
        ...(searchText ? { search: searchText } : {}),
        ...(catIds.length === 1 ? { category_id: catIds[0] } : {}),
      });
      setProducts(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 搜索防抖：search 变化 300ms 后更新 debouncedSearch
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // 筛选条件变化时重新加载（重置页码）
  useEffect(() => {
    loadProducts(1, pageSize, statusFilter, debouncedSearch, categoryFilter);
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, debouncedSearch, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 翻页 */
  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
    setSelectedIds(new Set());
    loadProducts(p, ps, statusFilter, debouncedSearch, categoryFilter);
  };

  // ---- 选择 ----

  /** 切换单行选择 */
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /** 全选当前页 */
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  // ---- 批量操作 ----

  const handleBatchStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    const result = await batchUpdateStatus(getToken(), Array.from(selectedIds), status);
    setBatchLoading(false);
    setSelectedIds(new Set());
    loadProducts(page, pageSize, statusFilter, debouncedSearch, categoryFilter);
    return result;
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    const result = await batchDelete(getToken(), Array.from(selectedIds));
    setBatchLoading(false);
    setSelectedIds(new Set());
    loadProducts(page, pageSize, statusFilter, debouncedSearch, categoryFilter);
    return result;
  };

  // ---- 删除 ----

  const handleDelete = async (id: number) => {
    const { deleteProduct } = await import('@/lib/api/products');
    try {
      await deleteProduct(getToken(), id);
      setDeletingId(null);
      const newTotal = total - 1;
      const lastPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = page > lastPage ? lastPage : page;
      loadProducts(targetPage, pageSize, statusFilter, debouncedSearch, categoryFilter);
      setPage(targetPage);
    } catch (e) {
      setDeletingId(null);
      setError(e instanceof ApiError ? e.message : '删除失败，请重试');
    }
  };

  return {
    // 列表
    products, total, page, pageSize, loading, error,
    // 筛选
    statusFilter, setStatusFilter, search, setSearch, categoryFilter, setCategoryFilter,
    // 分页
    handlePageChange,
    // 选择
    selectedIds, toggleSelect, toggleSelectAll,
    // 批量
    batchLoading, handleBatchStatus, handleBatchDelete,
    // 删除
    deletingId, handleDelete, setDeletingId,
    // 刷新
    refresh: () => loadProducts(page, pageSize, statusFilter, debouncedSearch, categoryFilter),
  };
}
```

- [ ] **Step 2: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/useProducts.ts
git commit -m "feat: add useProducts hook for product list"
```

---

### Task 3: 列表页 UI — columns + MobileProductCard

**Files:**
- Create: `src/app/products/columns.tsx`
- Create: `src/app/products/MobileProductCard.tsx`

**Consumes:** `AdminProduct` (Task 1), `useProducts` return interface (Task 2), `Table.Column` (existing)
**Produces:** `makeColumns()`, `MobileProductCard` — consumed by page.tsx (Task 4)

- [ ] **Step 1: 创建列定义**

Write `src/app/products/columns.tsx`:

```typescript
/**
 * 商品管理 — 桌面端 Table 列定义。
 */

import type { Column } from '@/components/shared/Table';
import type { AdminProduct } from '@/lib/api/products';
import { useRouter } from 'next/navigation';

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
          className="h-4 w-4 rounded border-gray-300" />
      ), width: '40px', align: 'center',
      render: (p) => (
        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => onToggleSelect(p.id)}
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
          <p className="text-sm font-medium text-gray-900">${Number(p.base_price).toFixed(2)}</p>
          {p.sale_price && (
            <p className="text-xs text-gray-400 line-through">${Number(p.sale_price).toFixed(2)}</p>
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
      key: 'created_at', title: '创建时间', width: '140px', align: 'center',
      render: (p) => <span className="text-xs text-gray-400">{formatDate(p.created_at)}</span>,
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
```

- [ ] **Step 2: 创建移动端卡片组件**

Write `src/app/products/MobileProductCard.tsx`:

```typescript
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
  products: AdminProduct[];
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
  products, loading, emptyText, deletingId,
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

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-2">
      {products.map((p) => {
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
```

- [ ] **Step 3: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/columns.tsx src/app/products/MobileProductCard.tsx
git commit -m "feat: add product list columns and mobile card components"
```

---

### Task 4: 列表页 page.tsx

**Files:**
- Modify: `src/app/products/page.tsx`

**Consumes:** `useProducts` (Task 2), `makeColumns` (Task 3), `MobileProductCard` (Task 3), `Table` (existing shared component)
**Produces:** 完整的 `/products` 列表页

- [ ] **Step 1: 替换占位内容**

Replace `src/app/products/page.tsx`:

```typescript
'use client';

/**
 * 商品管理列表页 — 状态编排层。
 * 数据/分页/筛选/批量操作 → useProducts hook
 * 桌面端列定义            → makeColumns()
 * 移动端卡片列表          → MobileProductCard
 */

import { useProducts } from './useProducts';
import { makeColumns } from './columns';
import { MobileProductCard } from './MobileProductCard';
import { Table } from '@/components/shared/Table';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCategories } from '@/lib/api/categories';
import type { AdminCategory } from '@/lib/api/categories';

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'active', label: '在售' },
  { key: 'inactive', label: '下架' },
];

export default function ProductsPage() {
  const router = useRouter();
  const {
    products, total, page, pageSize, loading, error,
    statusFilter, setStatusFilter, search, setSearch,
    categoryFilter, setCategoryFilter,
    handlePageChange,
    selectedIds, toggleSelect, toggleSelectAll,
    batchLoading, handleBatchStatus, handleBatchDelete,
    deletingId, handleDelete, setDeletingId,
  } = useProducts();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  // 加载分类列表
  useEffect(() => {
    const token = localStorage.getItem('hope_admin_token') || '';
    getCategories(token).then(setCategories).catch(() => {});
  }, []);

  const columns = makeColumns({
    selectedIds,
    onToggleSelect: toggleSelect,
    onToggleSelectAll: toggleSelectAll,
    allSelected: products.length > 0 && selectedIds.size === products.length,
    onEdit: (id) => router.push(`/products/${id}`),
    onRowClick: (id) => router.push(`/products/${id}`),
    onRequestDelete: (id) => setDeletingId(id),
    onConfirmDelete: (id) => handleDelete(id),
    onCancelDelete: () => setDeletingId(null),
    deletingId,
  });

  const emptyText = statusFilter
    ? `暂无${STATUS_TABS.find((t) => t.key === statusFilter)?.label || ''}状态的商品`
    : '暂无商品，点击「添加商品」创建';

  /** 分类多选切换 */
  const toggleCategory = (id: number) => {
    setCategoryFilter((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">商品管理</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* 操作栏 Row 1：状态 Tabs + 搜索 */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex items-center gap-2">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索商品名称..."
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-gray-900 focus:outline-none w-48 lg:w-56"
          />
          <button type="button" onClick={() => router.push('/products/new')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
            添加商品
          </button>
        </div>
      </div>

      {/* 操作栏 Row 2：分类筛选 + 批量操作 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <button type="button" onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter.length > 0 ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}>
            全部分类 {categoryFilter.length > 0 ? `(${categoryFilter.length})` : '▼'}
          </button>
          {catDropdownOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="max-h-64 overflow-y-auto p-2">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <p className="px-2 py-1 text-xs font-medium text-gray-400">{cat.name}</p>
                    {cat.children?.map((child) => (
                      <label key={child.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={categoryFilter.includes(child.id)}
                          onChange={() => toggleCategory(child.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300" />
                        <span className="text-sm text-gray-700">{child.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="px-2 py-2 text-xs text-gray-400">暂无分类</p>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">已选 {selectedIds.size} 项</span>
            <button type="button" disabled={batchLoading}
              onClick={() => handleBatchStatus('active')}
              className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50">
              批量上架
            </button>
            <button type="button" disabled={batchLoading}
              onClick={() => handleBatchStatus('inactive')}
              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
              批量下架
            </button>
            <button type="button" disabled={batchLoading}
              onClick={handleBatchDelete}
              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
              批量删除
            </button>
          </div>
        )}
      </div>

      {/* 桌面端表格 */}
      <div className="hidden md:block">
        <Table
          columns={columns} data={products} total={total}
          currentPage={page} currentPageSize={pageSize}
          onPageChange={handlePageChange} keyExtractor={(p) => p.id}
          loading={loading} emptyText={emptyText}
        />
      </div>

      {/* 移动端卡片 */}
      <div className="md:hidden">
        <MobileProductCard
          products={products} loading={loading} emptyText={emptyText}
          deletingId={deletingId} page={page} pageSize={pageSize} total={total}
          onEdit={(id) => router.push(`/products/${id}`)}
          onRowClick={(id) => router.push(`/products/${id}`)}
          onRequestDelete={(id) => setDeletingId(id)}
          onConfirmDelete={(id) => handleDelete(id)}
          onCancelDelete={() => setDeletingId(null)}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/page.tsx
git commit -m "feat: implement product list page with search, filter, batch operations"
```

---

### Task 5: 编辑页容器 + useProductDetail hook

**Files:**
- Create: `src/app/products/[id]/page.tsx`
- Create: `src/app/products/[id]/hooks/useProductDetail.ts`

**Consumes:** `AdminProductDetail`, `getProduct`, `createProduct`, `updateProduct` (Task 1), `ProductFormData`, `EMPTY_FORM`, `ProductBasicInfo` (Task 1 types)
**Produces:** 编辑页路由 `/products/new` 和 `/products/:id`，Tab 切换容器，`useProductDetail` hook

- [ ] **Step 1: 创建 useProductDetail hook**

Write `src/app/products/[id]/hooks/useProductDetail.ts`:

```typescript
/**
 * 商品编辑页 — 详情获取 + 整体保存 hook。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct, createProduct, updateProduct } from '@/lib/api/products';
import { ApiError } from '@/lib/api/client';
import type { AdminProductDetail } from '@/lib/api/products';
import type { ProductFormData, ProductBasicInfo } from '../../types';
import { EMPTY_FORM } from '../../types';

export function useProductDetail(id: string) {
  const router = useRouter();
  const isNew = id === 'new';

  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hope_admin_token') || '';
  };

  /** 加载商品详情（编辑模式） */
  const loadProduct = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await getProduct(getToken(), Number(id));
      setProduct(detail);
      // 将后端数据映射为表单结构
      setForm({
        basic: {
          name: detail.name,
          slug: detail.slug,
          description: detail.description || '',
          category_id: detail.category?.id ?? null,
          base_price: detail.base_price,
          sale_price: detail.sale_price,
          cost_price: (detail as AdminProductDetail).cost_price,
          status: detail.status,
          sort: (detail as AdminProductDetail).sort || 0,
        },
        skcs: [],   // SKC 和变体由独立 hook 管理
        variants: [],
        meta: detail.meta || {},
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  /** 保存 */
  const handleSave = async () => {
    setSaveError(null);

    // 基础信息校验
    const { basic } = form;
    if (!basic.name.trim()) { setSaveError('商品名称不能为空'); setActiveTab(0); return; }
    if (!basic.slug.trim()) { setSaveError('Slug 不能为空'); setActiveTab(0); return; }
    if (!basic.category_id) { setSaveError('请选择分类'); setActiveTab(0); return; }
    if (basic.base_price < 0) { setSaveError('原价不能为负数'); setActiveTab(0); return; }

    setSaving(true);
    try {
      const payload = {
        name: basic.name,
        slug: basic.slug,
        description: basic.description || undefined,
        category_id: basic.category_id!,
        base_price: basic.base_price,
        sale_price: basic.sale_price ?? undefined,
        cost_price: basic.cost_price ?? undefined,
        status: basic.status,
        sort: basic.sort,
        meta: Object.keys(form.meta).length > 0 ? form.meta : undefined,
      };

      if (isNew) {
        await createProduct(getToken(), payload);
      } else {
        await updateProduct(getToken(), Number(id), payload);
      }
      router.push('/products');
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /** 更新基础信息字段 */
  const updateBasic = (partial: Partial<ProductBasicInfo>) => {
    setForm((prev) => ({ ...prev, basic: { ...prev.basic, ...partial } }));
  };

  return {
    isNew, product, loading, error,
    activeTab, setActiveTab,
    form, setForm, updateBasic,
    saving, saveError, setSaveError,
    handleSave,
  };
}
```

- [ ] **Step 2: 创建编辑页容器**

Write `src/app/products/[id]/page.tsx`:

```typescript
'use client';

/**
 * 商品编辑页 — 容器组件。
 * Tab 切换 + 保存操作入口。
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProductDetail } from './hooks/useProductDetail';
import { BasicInfoTab } from './BasicInfoTab';
import { ImagesTab } from './ImagesTab';
import { VariantsTab } from './VariantsTab';
import { MetaTab } from './MetaTab';

const TABS = ['基础信息', '颜色图片', 'SKU变体', '扩展信息'];

export default function ProductEditPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    isNew, product, loading, error,
    activeTab, setActiveTab,
    form, setForm, updateBasic,
    saving, saveError, handleSave,
  } = useProductDetail(id);

  if (error) {
    return (
      <div>
        <Link href="/products" className="mb-4 inline-block text-sm text-gray-400 hover:text-gray-700">← 返回列表</Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  const title = isNew ? '新建商品' : (product ? `编辑商品：${product.name}` : '加载中...');

  return (
    <div>
      {/* 顶部栏 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-sm text-gray-400 hover:text-gray-700">← 返回列表</Link>
          <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">
            {loading ? '加载中...' : title}
          </h1>
        </div>
        <button type="button" onClick={handleSave} disabled={saving || loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {saveError && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{saveError}</div>
      )}

      {/* Tab 栏 */}
      <div className="mb-6 flex items-center gap-1 border-b border-gray-200 pb-0">
        {TABS.map((label, i) => (
          <button key={label} type="button" onClick={() => setActiveTab(i)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === i
                ? 'border-b-2 border-gray-900 text-gray-900 -mb-[1px]'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {activeTab === 0 && <BasicInfoTab form={form} updateBasic={updateBasic} />}
        {activeTab === 1 && <ImagesTab form={form} setForm={setForm} />}
        {activeTab === 2 && <VariantsTab form={form} setForm={setForm} />}
        {activeTab === 3 && <MetaTab form={form} setForm={setForm} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/\[id\]/
git commit -m "feat: add product edit page container with tab switching"
```

---

### Task 6: BasicInfoTab（Tab 1：基础信息）

**Files:**
- Create: `src/app/products/[id]/BasicInfoTab.tsx`

**Consumes:** `ProductFormData`, `ProductBasicInfo` (Task 1 types)
**Produces:** `BasicInfoTab` component

- [ ] **Step 1: 创建 BasicInfoTab**

Write `src/app/products/[id]/BasicInfoTab.tsx`:

```typescript
'use client';

/**
 * 商品编辑页 — Tab 1：基础信息表单。
 */

import { useEffect, useState } from 'react';
import { getCategories } from '@/lib/api/categories';
import type { AdminCategory } from '@/lib/api/categories';
import type { ProductFormData, ProductBasicInfo } from '../types';

interface BasicInfoTabProps {
  form: ProductFormData;
  updateBasic: (partial: Partial<ProductBasicInfo>) => void;
}

const STATUS_OPTIONS = [
  { key: 'draft' as const, label: '草稿' },
  { key: 'active' as const, label: '在售' },
  { key: 'inactive' as const, label: '下架' },
];

export function BasicInfoTab({ form, updateBasic }: BasicInfoTabProps) {
  const { basic } = form;
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('hope_admin_token') || '';
    getCategories(token).then(setCategories).catch(() => {});
  }, []);

  /** 收集所有可选的子分类（扁平化） */
  const flatOptions = categories.flatMap((cat) =>
    cat.children?.map((child) => ({
      value: child.id,
      label: `${cat.name} > ${child.name}`,
    })) || []
  );

  return (
    <div className="max-w-xl space-y-4">
      {/* 商品名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">商品名称</label>
        <input type="text" required maxLength={255}
          value={basic.name} onChange={(e) => updateBasic({ name: e.target.value })}
          placeholder="如：波点连衣裙"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input type="text" required maxLength={255}
          value={basic.slug} onChange={(e) => updateBasic({ slug: e.target.value })}
          placeholder="如：polka-dot-dress"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>

      {/* 描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">描述</label>
        <textarea rows={3}
          value={basic.description} onChange={(e) => updateBasic({ description: e.target.value })}
          placeholder="商品描述..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>

      {/* 分类 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">分类</label>
        <select value={basic.category_id ?? ''}
          onChange={(e) => updateBasic({ category_id: e.target.value ? Number(e.target.value) : null })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none">
          <option value="">请选择分类</option>
          {categories.map((cat) => (
            <optgroup key={cat.id} label={cat.name}>
              {cat.children?.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 价格 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">原价 (USD)</label>
          <input type="number" required min={0} step="0.01"
            value={basic.base_price} onChange={(e) => updateBasic({ base_price: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">售价 (USD)</label>
          <input type="number" min={0} step="0.01"
            value={basic.sale_price ?? ''} onChange={(e) => updateBasic({ sale_price: e.target.value ? Number(e.target.value) : null })}
            placeholder="选填"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">成本价 (USD)</label>
          <input type="number" min={0} step="0.01"
            value={basic.cost_price ?? ''} onChange={(e) => updateBasic({ cost_price: e.target.value ? Number(e.target.value) : null })}
            placeholder="选填"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
        </div>
      </div>

      {/* 状态 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">状态</label>
        <div className="mt-1 flex items-center gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button key={s.key} type="button" onClick={() => updateBasic({ status: s.key })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                basic.status === s.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 排序 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">排序</label>
        <input type="number" min={0}
          value={basic.sort} onChange={(e) => updateBasic({ sort: Number(e.target.value) })}
          className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/\[id\]/BasicInfoTab.tsx
git commit -m "feat: add product edit BasicInfoTab"
```

---

### Task 7: ImagesTab + useImages hook（Tab 2：颜色 + 图片）

**Files:**
- Create: `src/app/products/[id]/ImagesTab.tsx`
- Create: `src/app/products/[id]/hooks/useImages.ts`

**Consumes:** `SkcGroup`, `ProductImageItem`, `ProductFormData` (Task 1 types)
**Produces:** `ImagesTab` component + `useImages` hook

- [ ] **Step 1: 创建 useImages hook**

Write `src/app/products/[id]/hooks/useImages.ts`:

```typescript
/**
 * 商品编辑页 — SKC 颜色组 + 图片管理逻辑。
 */

import type { SkcGroup, ProductImageItem, ProductFormData } from '../../types';

interface UseImagesReturn {
  /** 添加新颜色组 */
  addSkc: () => void;
  /** 删除颜色组 */
  removeSkc: (index: number) => void;
  /** 更新颜色组字段 */
  updateSkc: (index: number, partial: Partial<SkcGroup>) => void;
  /** 切换展开/折叠 */
  toggleSkc: (index: number) => void;
  /** 添加图片到指定颜色组 */
  addImage: (skcIndex: number) => void;
  /** 删除图片 */
  removeImage: (skcIndex: number, imageIndex: number) => void;
  /** 更新图片字段 */
  updateImage: (skcIndex: number, imageIndex: number, partial: Partial<ProductImageItem>) => void;
  /** 设置主图 */
  setPrimaryImage: (skcIndex: number, imageIndex: number) => void;
}

export function useImages(
  form: ProductFormData,
  setForm: (f: ProductFormData) => void,
): UseImagesReturn {
  const addSkc = () => {
    const newSkc: SkcGroup = {
      color: '', color_hex: '#4F6EF7', sort: form.skcs.length, images: [], expanded: true,
    };
    setForm({ ...form, skcs: [...form.skcs, newSkc] });
  };

  const removeSkc = (index: number) => {
    const skcs = form.skcs.filter((_, i) => i !== index);
    setForm({ ...form, skcs });
  };

  const updateSkc = (index: number, partial: Partial<SkcGroup>) => {
    const skcs = form.skcs.map((s, i) => i === index ? { ...s, ...partial } : s);
    setForm({ ...form, skcs });
  };

  const toggleSkc = (index: number) => {
    const skcs = form.skcs.map((s, i) => i === index ? { ...s, expanded: !s.expanded } : s);
    setForm({ ...form, skcs });
  };

  const addImage = (skcIndex: number) => {
    const newImage: ProductImageItem = { url: '', alt: '', sort: form.skcs[skcIndex].images.length, is_primary: false };
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? { ...s, images: [...s.images, newImage] } : s
    );
    setForm({ ...form, skcs });
  };

  const removeImage = (skcIndex: number, imageIndex: number) => {
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? { ...s, images: s.images.filter((_, j) => j !== imageIndex) } : s
    );
    setForm({ ...form, skcs });
  };

  const updateImage = (skcIndex: number, imageIndex: number, partial: Partial<ProductImageItem>) => {
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? {
        ...s,
        images: s.images.map((img, j) => j === imageIndex ? { ...img, ...partial } : img),
      } : s
    );
    setForm({ ...form, skcs });
  };

  const setPrimaryImage = (skcIndex: number, imageIndex: number) => {
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? {
        ...s,
        images: s.images.map((img, j) => ({ ...img, is_primary: j === imageIndex })),
      } : s
    );
    setForm({ ...form, skcs });
  };

  return { addSkc, removeSkc, updateSkc, toggleSkc, addImage, removeImage, updateImage, setPrimaryImage };
}
```

- [ ] **Step 2: 创建 ImagesTab**

Write `src/app/products/[id]/ImagesTab.tsx`:

```typescript
'use client';

/**
 * 商品编辑页 — Tab 2：SKC 颜色组 + 图片管理。
 */

import { useImages } from './hooks/useImages';
import type { ProductFormData } from '../types';

interface ImagesTabProps {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
}

export function ImagesTab({ form, setForm }: ImagesTabProps) {
  const { addSkc, removeSkc, updateSkc, toggleSkc, addImage, removeImage, updateImage, setPrimaryImage } = useImages(form, setForm);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">管理商品的颜色组和对应图片</p>
        <button type="button" onClick={addSkc}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover">
          + 添加颜色
        </button>
      </div>

      {form.skcs.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">暂无颜色组，点击「添加颜色」创建</p>
      )}

      <div className="space-y-3">
        {form.skcs.map((skc, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/50">
            {/* 颜色头部 */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => toggleSkc(i)}>
              <div className="h-6 w-6 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: skc.color_hex }} />
              <input type="text" value={skc.color} placeholder="颜色名称"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateSkc(i, { color: e.target.value })}
                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none" />
              <div className="flex items-center gap-1">
                <input type="text" value={skc.color_hex} maxLength={7}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSkc(i, { color_hex: e.target.value })}
                  placeholder="#RRGGBB"
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-xs font-mono focus:border-gray-900 focus:outline-none" />
                <input type="color" value={skc.color_hex}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSkc(i, { color_hex: e.target.value })}
                  className="h-7 w-7 cursor-pointer rounded border border-gray-300" />
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-gray-400">排序</span>
                <input type="number" min={0} value={skc.sort}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSkc(i, { sort: Number(e.target.value) })}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none" />
                <button type="button" onClick={(e) => { e.stopPropagation(); removeSkc(i); }}
                  className="ml-2 rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50">
                  删除
                </button>
              </div>
              <span className="text-xs text-gray-300">{skc.expanded ? '▲' : '▼'}</span>
            </div>

            {/* 展开的图片列表 */}
            {skc.expanded && (
              <div className="border-t border-gray-200 px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  {skc.images.map((img, j) => (
                    <div key={j} className="relative w-28 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2">
                      {img.url ? (
                        <img src={img.url} alt={img.alt || skc.color}
                          className="mb-2 h-24 w-full rounded object-cover" />
                      ) : (
                        <div className="mb-2 flex h-24 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-300">
                          无图片
                        </div>
                      )}
                      <input type="text" value={img.url} placeholder="图片 URL"
                        onChange={(e) => updateImage(i, j, { url: e.target.value })}
                        className="mb-1 block w-full rounded border border-gray-200 px-1.5 py-0.5 text-xs focus:border-gray-900 focus:outline-none" />
                      <div className="flex items-center justify-between mt-1">
                        <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                          <input type="radio" name={`primary-${i}`} checked={img.is_primary}
                            onChange={() => setPrimaryImage(i, j)}
                            className="h-3 w-3" />
                          主图
                        </label>
                        <button type="button" onClick={() => removeImage(i, j)}
                          className="text-xs text-red-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addImage(i)}
                    className="flex h-[148px] w-28 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500">
                    + 添加图片
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/\[id\]/ImagesTab.tsx src/app/products/\[id\]/hooks/useImages.ts
git commit -m "feat: add product edit ImagesTab with SKC and image management"
```

---

### Task 8: VariantsTab + useVariants hook（Tab 3：SKU 变体矩阵）

**Files:**
- Create: `src/app/products/[id]/VariantsTab.tsx`
- Create: `src/app/products/[id]/hooks/useVariants.ts`

**Consumes:** `ProductVariantItem`, `ProductFormData`, `DEFAULT_SIZES` (Task 1 types)
**Produces:** `VariantsTab` component + `useVariants` hook

- [ ] **Step 1: 创建 useVariants hook**

Write `src/app/products/[id]/hooks/useVariants.ts`:

```typescript
/**
 * 商品编辑页 — SKU 变体管理逻辑。
 */

import { useState } from 'react';
import type { ProductVariantItem, ProductFormData } from '../../types';
import { DEFAULT_SIZES } from '../../types';

interface UseVariantsReturn {
  sizes: string[];
  /** 添加自定义尺码 */
  addSize: (size: string) => void;
  /** 删除尺码列（同时删除该尺码的所有变体） */
  removeSize: (size: string) => void;
  /** 获取或创建变体 */
  getVariant: (color: string, size: string) => ProductVariantItem | undefined;
  /** 更新变体 */
  updateVariant: (color: string, size: string, partial: Partial<ProductVariantItem>) => void;
  /** 批量填充选中的格子 */
  batchFill: (cells: { color: string; size: string }[], partial: Partial<ProductVariantItem>) => void;
  /** 获取 slug 前缀（用于 SKU 生成） */
  slug: string;
}

export function useVariants(
  form: ProductFormData,
  setForm: (f: ProductFormData) => void,
): UseVariantsReturn {
  const [sizes, setSizes] = useState<string[]>(() => {
    // 从已有变体提取尺码 + 默认尺码
    const existing = new Set(form.variants.map((v) => v.size));
    return [...new Set([...DEFAULT_SIZES, ...existing])];
  });

  const colors = form.skcs.map((s) => s.color).filter(Boolean);

  const slug = form.basic.slug || 'product';

  /** 生成 SKU */
  const makeSku = (color: string, size: string): string => {
    const colorAbbr = color.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    return `${slug}-${colorAbbr}-${size}`.replace(/[^a-zA-Z0-9-]/g, '');
  };

  const getVariant = (color: string, size: string): ProductVariantItem | undefined => {
    return form.variants.find((v) => v.color === color && v.size === size);
  };

  const updateVariant = (color: string, size: string, partial: Partial<ProductVariantItem>) => {
    const existing = getVariant(color, size);
    if (existing) {
      setForm({
        ...form,
        variants: form.variants.map((v) =>
          v.color === color && v.size === size ? { ...v, ...partial } : v
        ),
      });
    } else {
      const newVariant: ProductVariantItem = {
        sku: makeSku(color, size),
        color,
        size,
        price: partial.price ?? form.basic.base_price,
        stock: partial.stock ?? 0,
        status: partial.status ?? 'active',
      };
      setForm({ ...form, variants: [...form.variants, newVariant] });
    }
  };

  const batchFill = (cells: { color: string; size: string }[], partial: Partial<ProductVariantItem>) => {
    let updated = [...form.variants];
    cells.forEach(({ color, size }) => {
      const existing = updated.findIndex((v) => v.color === color && v.size === size);
      if (existing >= 0) {
        updated[existing] = { ...updated[existing], ...partial };
      } else {
        updated.push({
          sku: makeSku(color, size), color, size,
          price: partial.price ?? form.basic.base_price,
          stock: partial.stock ?? 0,
          status: partial.status ?? 'active',
        });
      }
    });
    setForm({ ...form, variants: updated });
  };

  const addSize = (size: string) => {
    if (size && !sizes.includes(size)) setSizes([...sizes, size]);
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter((s) => s !== size));
    setForm({ ...form, variants: form.variants.filter((v) => v.size !== size) });
  };

  return { sizes, addSize, removeSize, getVariant, updateVariant, batchFill, slug };
}
```

- [ ] **Step 2: 创建 VariantsTab**

Write `src/app/products/[id]/VariantsTab.tsx`:

```typescript
'use client';

/**
 * 商品编辑页 — Tab 3：SKU 变体矩阵（颜色×尺码）。
 */

import { useState } from 'react';
import { useVariants } from './hooks/useVariants';
import type { ProductFormData } from '../types';

interface VariantsTabProps {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
}

export function VariantsTab({ form, setForm }: VariantsTabProps) {
  const { sizes, addSize, removeSize, getVariant, updateVariant, batchFill } = useVariants(form, setForm);
  const [newSize, setNewSize] = useState('');

  const colors = form.skcs.map((s) => s.color).filter(Boolean);

  // 批量选择状态
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const cellKey = (color: string, size: string) => `${color}::${size}`;

  const toggleCell = (color: string, size: string) => {
    setSelectedCells((prev) => {
      const next = new Set(prev);
      const key = cellKey(color, size);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleBatchPrice = () => {
    const cells = Array.from(selectedCells).map((k) => {
      const [color, size] = k.split('::');
      return { color, size };
    });
    const price = prompt('输入统一价格 (USD):');
    if (price && !isNaN(Number(price))) {
      batchFill(cells, { price: Number(price) });
      setSelectedCells(new Set());
    }
  };

  const handleBatchStock = () => {
    const cells = Array.from(selectedCells).map((k) => {
      const [color, size] = k.split('::');
      return { color, size };
    });
    const stock = prompt('输入统一库存:');
    if (stock && !isNaN(Number(stock))) {
      batchFill(cells, { stock: Number(stock) });
      setSelectedCells(new Set());
    }
  };

  if (colors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        请先在「颜色图片」Tab 中添加颜色组，变体矩阵自动同步
      </p>
    );
  }

  return (
    <div>
      {/* 尺码管理 + 批量填充 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {sizes.map((size) => (
            <span key={size} className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
              {size}
              <button type="button" onClick={() => removeSize(size)}
                className="text-gray-300 hover:text-red-500">×</button>
            </span>
          ))}
          <div className="flex items-center gap-0.5">
            <input type="text" value={newSize} placeholder="新尺码"
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { addSize(newSize); setNewSize(''); } }}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none" />
            <button type="button" onClick={() => { addSize(newSize); setNewSize(''); }}
              className="rounded border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-400 hover:border-gray-400">
              +
            </button>
          </div>
        </div>

        {selectedCells.size > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">已选 {selectedCells.size} 格</span>
            <button type="button" onClick={handleBatchPrice}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
              统一价格
            </button>
            <button type="button" onClick={handleBatchStock}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
              统一库存
            </button>
          </div>
        )}
      </div>

      {/* 矩阵表格 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">颜色</th>
              {sizes.map((size) => (
                <th key={size} className="border-b border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-500 min-w-[100px]">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr key={color}>
                <td className="sticky left-0 bg-white border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-900">
                  {color}
                </td>
                {sizes.map((size) => {
                  const v = getVariant(color, size);
                  const selected = selectedCells.has(cellKey(color, size));
                  return (
                    <td key={size} className={`border-b border-gray-100 px-2 py-2 ${selected ? 'bg-blue-50/50' : ''}`}
                      onClick={() => toggleCell(color, size)}>
                      {v ? (
                        <div className="space-y-1 cursor-pointer">
                          <input type="number" min={0} step="0.01" value={v.price}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateVariant(color, size, { price: Number(e.target.value) })}
                            className="block w-full rounded border border-gray-200 px-2 py-1 text-xs text-center focus:border-gray-900 focus:outline-none"
                            placeholder="价格" />
                          <input type="number" min={0} step="1" value={v.stock}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateVariant(color, size, { stock: Number(e.target.value) })}
                            className="block w-full rounded border border-gray-200 px-2 py-1 text-xs text-center focus:border-gray-900 focus:outline-none"
                            placeholder="库存" />
                        </div>
                      ) : (
                        <div className="py-3 text-center text-xs text-gray-300 cursor-pointer">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/\[id\]/VariantsTab.tsx src/app/products/\[id\]/hooks/useVariants.ts
git commit -m "feat: add product edit VariantsTab with color x size matrix"
```

---

### Task 9: MetaTab（Tab 4：扩展信息）

**Files:**
- Create: `src/app/products/[id]/MetaTab.tsx`

**Consumes:** `ProductFormData` (Task 1 types)
**Produces:** `MetaTab` component

- [ ] **Step 1: 创建 MetaTab**

Write `src/app/products/[id]/MetaTab.tsx`:

```typescript
'use client';

/**
 * 商品编辑页 — Tab 4：扩展信息（自由 JSON 编辑）。
 */

import { useState } from 'react';
import type { ProductFormData } from '../types';

interface MetaTabProps {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
}

export function MetaTab({ form, setForm }: MetaTabProps) {
  const [text, setText] = useState(() =>
    Object.keys(form.meta).length > 0 ? JSON.stringify(form.meta, null, 2) : ''
  );
  const [parseError, setParseError] = useState<string | null>(null);

  /** 格式化 JSON */
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(text || '{}');
      const formatted = JSON.stringify(parsed, null, 2);
      setText(formatted);
      setForm({ ...form, meta: parsed });
      setParseError(null);
    } catch (e) {
      setParseError(`JSON 格式错误：${(e as Error).message}`);
    }
  };

  /** 校验 JSON */
  const handleValidate = () => {
    try {
      JSON.parse(text || '{}');
      setParseError(null);
      alert('JSON 格式正确 ✓');
    } catch (e) {
      setParseError(`JSON 格式错误：${(e as Error).message}`);
    }
  };

  /** 内容变更时同步到 form */
  const handleChange = (value: string) => {
    setText(value);
    try {
      const parsed = JSON.parse(value || '{}');
      setForm({ ...form, meta: parsed });
      setParseError(null);
    } catch {
      // 编辑过程中可能不完整，不同步但也不报错
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          自由 JSON 扩展字段，如面料、尺码表、洗护说明等
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleFormat}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50">
            格式化
          </button>
          <button type="button" onClick={handleValidate}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50">
            校验 JSON
          </button>
        </div>
      </div>

      {parseError && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600 font-mono">{parseError}</div>
      )}

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`{\n  "fabric": "100% Cotton",\n  "care": "Machine wash cold"\n}`}
        rows={16}
        className="block w-full rounded-md border border-gray-300 px-4 py-3 font-mono text-sm shadow-sm focus:border-gray-900 focus:outline-none resize-y"
        spellCheck={false}
      />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/\[id\]/MetaTab.tsx
git commit -m "feat: add product edit MetaTab for freeform JSON editing"
```

---

### Task 10: 集成验证 + 关闭 cat dropdown

**Files:**
- Modify: `src/app/products/page.tsx` — 点击外部关闭分类下拉

**Consumes:** All previous tasks

- [ ] **Step 1: 添加点击外部关闭下拉逻辑**

修改 `src/app/products/page.tsx`，在文件顶部将 `useEffect, useState` 改为 `useEffect, useRef, useState`：

```typescript
import { useEffect, useRef, useState } from 'react';
```

在组件内 categories state 之后添加 ref 和关闭逻辑：

```typescript
const catRef = useRef<HTMLDivElement>(null);

// 点击外部关闭分类下拉
useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    if (catRef.current && !catRef.current.contains(e.target as Node)) {
      setCatDropdownOpen(false);
    }
  };
  if (catDropdownOpen) document.addEventListener('mousedown', handleClick);
  return () => document.removeEventListener('mousedown', handleClick);
}, [catDropdownOpen]);
```

在分类下拉的容器 div 上添加 `ref={catRef}`：

```typescript
<div className="relative" ref={catRef}>
```

- [ ] **Step 2: 运行 dev server 验证**

```bash
cd /var/www/arelonne/web-admin && npm run dev -- -p 3001
```

访问 `http://localhost:3001/products`：
- 列表页加载、搜索、筛选、批量选择正常
- 新建商品 `/products/new` 四个 Tab 正常切换
- 编辑商品 `/products/:id` 加载数据并显示

- [ ] **Step 3: 提交**

```bash
cd /var/www/arelonne/web-admin
git add src/app/products/page.tsx
git commit -m "fix: close category dropdown on outside click"
```

---

## 注意事项

1. **后端依赖 — Task 0 必做**：CategoryController 必须先部署，否则分类下拉和表单分类选择无法加载数据
2. **v1 保存范围**：`handleSave` 仅保存基础信息（name/slug/description/category_id/price/status/sort）+ meta。**SKC 颜色组和变体的前端 UI 完整可用**，但后端尚未实现 SKC/Variant 独立 CRUD 端点（目前仅 ProductController@store 支持基础信息，SKC/Variant 需后续新增端点），因此 v1 保存动作跳过 skcs 和 variants 数据
3. **图片上传**：使用 URL 输入模式，OSS 上传待后续版本
4. **加载已有 SKC/Variant**：编辑已有商品时 `loadProduct` 从后端获取 `AdminProductDetail`（含 variants 和 images），但表单的 `skcs` 字段需后续映射逻辑来从 variants 反推 SKC 结构。v1 中编辑已有商品时 ImagesTab 和 VariantsTab 从空白开始
5. **提交审核**：每个 Task 完成后 `/code-review` 审核
