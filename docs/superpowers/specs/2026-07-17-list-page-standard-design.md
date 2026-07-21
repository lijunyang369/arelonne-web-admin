# 后台列表页规范

> 日期：2026-07-17 | 状态：已确认 | 版本 v1

## 概述

Arelonne 后台管理系统所有列表页（商品、颜色、订单等）的统一开发规范。覆盖文件结构、Hook 接口、页面骨架、UI 组件、API 层、视觉风格。

---

## 一、目录结构

```
src/app/{module}/
  page.tsx                  ← 列表页入口（状态编排层），'use client'
  columns.tsx               ← 桌面端 Table 列定义，导出 makeColumns() + formatDate()
  Mobile{Module}Card.tsx    ← 移动端卡片列表 + 简化分页
  types.ts                  ← 模块前端类型（表单数据等）
  use{Module}List.ts        ← 列表数据 hook（核心）

src/lib/api/
  {module}.ts               ← API 方法 + 响应类型
```

### 命名规则

| 元素 | 格式 | 示例 |
|------|------|------|
| 目录 | kebab-case | `products`, `colors`, `orders` |
| Hook | `use{Module}List` | `useProductList`, `useColorList` |
| 移动端卡片 | `Mobile{Module}Card` | `MobileProductCard`, `MobileColorCard` |
| API 文件 | 与目录同名 | `products.ts`, `colors.ts` |

---

## 二、核心 Hook 接口

```typescript
function use{Module}List(): {
  // ---- 列表数据（必选）----
  items: T[];                  // 当前页数据（统一叫 items，不用业务名）
  total: number;               // 总条数
  page: number;                // 当前页码（1-based）
  pageSize: number;            // 每页条数
  loading: boolean;            // 初始 true，加载中
  error: string | null;        // ApiError.message 或 null

  // ---- 分页（必选）----
  handlePageChange: (page: number, pageSize: number) => void;

  // ---- 状态筛选（必选）----
  statusFilter: string;        // '' 表示全部
  setStatusFilter: (s: string) => void;

  // ---- 删除（必选）----
  deletingId: number | null;
  handleDelete: (id: number) => Promise<void>;
  setDeletingId: (id: number | null) => void;
}
```

### 规则

| # | 规则 |
|---|------|
| 1 | 数据字段统一叫 `items`，不用业务名 |
| 2 | `statusFilter === ''` 表示全部，不传 status 参数 |
| 3 | `handleDelete` 自动处理分页回退（删最后一条时回退一页） |
| 4 | 筛选条件变化 → `page` 重置为 1 → 重新加载 |
| 5 | `loading` 初始为 `true`，首次加载自动触发 |
| 6 | `error` 统一用 `ApiError` 提取 message |
| 7 | 删除确认用 `deletingId` 模式 |

### 可选扩展

- `search` / `setSearch` — 搜索文本（需 300ms 防抖，在 hook 内部处理）
- `selectedIds` / `toggleSelect` / `toggleSelectAll` — 批量选择
- `handleBatchStatus` / `handleBatchDelete` / `batchLoading` — 批量操作

---

## 三、页面骨架

```
┌──────────────────────────────────────────────────────┐
│  <h1> 页面标题                                        │
│  {error && <ErrorBanner>}                             │
│                                                       │
│  Row 1: [筛选 Tabs...]     [搜索框(可选)]  [+ 新增]    │
│                                                       │
│  Row 2: [扩展筛选(可选)]    [批量操作栏(条件显示)]      │
│                                                       │
│  Row 3: ┌─── desktop: hidden md:block ────────────┐  │
│         │ <Table columns items total ... />        │  │
│         └──────────────────────────────────────────┘  │
│         ┌─── mobile: md:hidden ───────────────────┐  │
│         │ <MobileXxxCard items ... />              │  │
│         └──────────────────────────────────────────┘  │
│                                                       │
│  Row 4: [编辑入口: Modal 或 独立页（不做约束）]         │
└──────────────────────────────────────────────────────┘
```

### 固定 Tailwind class

| 位置 | class |
|------|-------|
| 标题 | `text-xl font-bold text-gray-900 lg:text-2xl mb-6` |
| 错误横幅 | `bg-red-50 p-3 text-sm text-red-600 rounded-md mb-4` |
| 操作栏容器 | `flex flex-wrap items-center justify-between gap-3` |
| 多行间距 | `mb-3` / `mb-4` |
| 桌面表格 | `hidden md:block` |
| 移动卡片 | `md:hidden` |

### Table 调用规范

```typescript
<Table
  columns={columns}
  data={items}           // ← 统一用 items
  total={total}
  currentPage={page}
  currentPageSize={pageSize}
  onPageChange={handlePageChange}
  keyExtractor={(item) => item.id}
  loading={loading}
  emptyText={emptyText}
/>
```

### MobileCard 调用规范

```typescript
<MobileXxxCard
  items={items}           // ← 统一用 items
  loading={loading}
  emptyText={emptyText}
  deletingId={deletingId}
  page={page} pageSize={pageSize} total={total}
  onEdit={...}
  onRequestDelete={(id) => setDeletingId(id)}
  onConfirmDelete={(id) => handleDelete(id)}
  onCancelDelete={() => setDeletingId(null)}
  onPageChange={handlePageChange}
/>
```

### 空状态文本

```typescript
const emptyText = statusFilter
  ? `暂无该状态的${entityName}`
  : `暂无${entityName}，点击「添加${entityName}」创建`;
```

### 状态筛选 Tabs

```typescript
const STATUS_TABS = [
  { key: '', label: '全部' },    // ← 第一个必须是 '' 表示全部
  { key: 'active', label: '...' },
  { key: 'inactive', label: '...' },
];
```

激活态 `bg-gray-900 text-white`，默认态 `text-gray-500 hover:bg-gray-100`。

---

## 四、columns.tsx

### 导出

```typescript
export function makeColumns(opts: MakeColumnsOpts): Column<T>[]
export function formatDate(iso: string): string
```

### 列宽度约定

| 列用途 | 宽度 | 对齐 |
|--------|------|------|
| checkbox | `40px` | center |
| ID | `60px` | center |
| 图片/缩略图 | `64px` | center |
| 主标识 | 自适应 | left |
| 分类/类型 | `120px` | left |
| 价格 | `120px` | right |
| 状态 Badge | `80px` | center |
| 时间/更新信息 | `200px` | center | `hidden lg:table-cell`（小屏隐藏）|
| 操作 | `100px` | center | `whitespace-nowrap`。确认态 3 按钮（编辑+确认+取消 ≈94px）→ 取 100px |

### 状态 Badge 颜色

| 状态 | class |
|------|-------|
| 在售/活跃 | `bg-green-50 text-green-700` |
| 草稿/停用 | `bg-gray-100 text-gray-500` |
| 下架/异常 | `bg-red-50 text-red-600` |

### 更新信息列内容格式

`hidden lg:table-cell`，小屏隐藏。内容格式：

```
{updated_at && formatDate(updated_at)}
{updated_at && updated_by && ' · '}
{updated_by && updated_by}
```

若无 `updated_at`/`updated_by` 字段，降级使用 `created_at`：

```
{created_at && formatDate(created_at)}
```

渲染示例：

```tsx
{
  key: 'meta', title: '更新信息', className: 'hidden lg:table-cell', align: 'center', width: '200px',
  render: (item) => (
    <span className="whitespace-nowrap text-xs text-gray-400">
      {item.updated_at && <span>{formatDate(item.updated_at)}</span>}
      {item.updated_at && item.updated_by && <span className="mx-1">·</span>}
      {item.updated_by && <span>{item.updated_by}</span>}
      {!item.updated_at && item.created_at && <span>{formatDate(item.created_at)}</span>}
    </span>
  ),
}
```

### 桌面端信息密度

PC 端表格以提高信息密度为原则，减少视觉干扰：

**表格单元格（td/th）：**
- 默认 `whitespace-nowrap` — 禁止换行，溢出用省略号
- Padding 紧缩：`px-3 py-2`（默认）/ `px-2 py-1.5`（紧凑场景）
- 仅描述类长文本列可豁免 nowrap（需显式标注）

**表格整体：**
- `table-fixed` + colgroup 固定列宽 — 防止内容撑破布局
- 表格容器 `overflow-x-auto` — 小屏可水平滚动

**豁免列（允许换行）：**
- 描述/备注等长文本列
- 如有需要，通过 `className: 'whitespace-normal'` 显式开启

### 删除确认模式

```
初始: [编辑] [删除]
  ↓
确认: [编辑] [确认] [取消]
```

操作列按钮 class：
- 编辑：`text-gray-400 hover:bg-gray-100 hover:text-gray-700`
- 删除：`text-gray-400 hover:bg-gray-100 hover:text-red-500`
- 确认：`text-red-600 hover:bg-red-50 font-medium`
- 取消：`text-gray-400 hover:bg-gray-100`

---

## 五、MobileCard 组件

### 卡片结构

```
┌─────────────────────────────────────────────┐
│  Row 1: [缩略图 48×48] 名称         [状态]   │
│                    副标题（分类·价格）        │
│  Row 2: 创建时间 / ID / 辅助信息              │
│  Row 3: ────────────────────────────────     │
│                      [编辑] [删除] ← 右对齐   │
└─────────────────────────────────────────────┘
```

### 固定 class

| 元素 | class |
|------|-------|
| 卡片 | `rounded-lg border border-gray-200 bg-white p-4` |
| 缩略图 | `h-12 w-12 rounded object-cover` |
| 图占位 | `h-12 w-12 rounded bg-gray-100` + 灰色 "无" |
| 加载态 | `px-5 py-12 text-center text-sm text-gray-400` |
| 空态 | 同上 |
| 分页栏 | `flex items-center justify-between ...` |
| 分页按钮 | `border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-30` |

---

## 六、API 层

### 文件格式

```typescript
// 1. 响应类型
export interface Admin{Entity} { ... }
export interface Admin{Entity}Detail extends Admin{Entity} { ... }
export interface {Entity}ListResponse {
  data: Admin{Entity}[];
  meta: PaginationMeta;
}

// 2. 请求参数
export interface {Entity}ListParams {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
}

// 3. 方法签名
get{Entities}(token, params?): Promise<ListResponse>
get{Entity}(token, id): Promise<Detail>
create{Entity}(token, data): Promise<Detail>
update{Entity}(token, id, data): Promise<Detail>
delete{Entity}(token, id): Promise<void>
```

### 规则

- Token 总是第一个参数
- 分页响应统一 `{ data, meta }`
- `PaginationMeta` 复用现有类型（后续提取为共享类型）
- URLSearchParams 拼接查询参数
- 所有方法使用 `adminFetch`，不直接调 `apiFetch`

---

## 七、视觉规范速查

| 元素 | class |
|------|-------|
| 页面背景 | `bg-gray-50`（layout.tsx 全局） |
| 内容容器 | `rounded-lg border border-gray-200 bg-white` |
| 主按钮 | `bg-primary text-white hover:bg-primary-hover rounded-md` |
| 次按钮 | `border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-md` |
| Tab 激活 | `bg-gray-900 text-white rounded-md` |
| Tab 默认 | `text-gray-500 hover:bg-gray-100 rounded-md` |
| 表单输入 | `border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none` |
| 文本主色 | `text-gray-900` |
| 文本次色 | `text-gray-500` / `text-gray-400` |
| 字体 | `-apple-system, BlinkMacSystemFont, PingFang SC, Segoe UI, system-ui, sans-serif` |

### 颜色主题

| Token | 值 | 用途 |
|-------|-----|------|
| `primary` | `#4F6EF7` | 主按钮、链接 |
| `primary-hover` | `#4460DF` | 按钮 hover |
| `sidebar` | `#1E1E2D` | 侧边栏背景 |
| `sidebar-hover` | `#2A2A3C` | 侧边栏 hover |
| `surface` | `#F4F5F7` | 页面背景 |

---

## 八、不限范围

- 编辑入口模式（Modal vs 独立页）— 页面级决策
- 复杂筛选（分类多选、日期范围等）— 按需扩展
- 批量导入/导出
- 实时数据刷新
