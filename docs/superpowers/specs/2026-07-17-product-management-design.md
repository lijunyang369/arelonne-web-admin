# 商品管理页面设计

> 日期：2026-07-17 | 状态：已确认

## 概述

Arelonne 后台管理系统的商品管理模块。列表页支持搜索、筛选、批量操作；编辑页以 4 个 Tab 组织：基础信息、颜色图片、SKU 变体、扩展信息。

## 技术决策

- 复用现有项目模式：hook 驱动 + 组件纯展示 + 服务端分页
- 列表 → 独立编辑页（`/products` → `/products/:id`），不跳转弹窗
- 不引入新依赖，100% 复用 Table 组件和 apiFetch 基础设施

---

## 目录结构

```
src/app/products/
  page.tsx                  ← 商品列表页（/products）
  columns.tsx               ← 桌面端 Table 列定义
  MobileProductCard.tsx     ← 移动端卡片列表
  types.ts                  ← 表单类型定义
  useProducts.ts            ← 列表数据 + 分页 + 批量操作 hook

  [id]/
    page.tsx                ← 编辑页容器（/products/:id），Tab 切换 + 整体保存
    BasicInfoTab.tsx        ← Tab 1：基础信息
    ImagesTab.tsx           ← Tab 2：SKC 颜色组 + 图片管理
    VariantsTab.tsx         ← Tab 3：SKU 变体矩阵（颜色×尺码）
    MetaTab.tsx             ← Tab 4：Meta 扩展字段

    hooks/
      useProductDetail.ts   ← 单商品详情获取、基础信息更新
      useVariants.ts        ← 变体 CRUD
      useImages.ts          ← 图片/SKC CRUD

src/lib/api/
  products.ts               ← 商品 API（列表/详情/创建/更新/删除/批量操作）
  categories.ts             ← 分类 API（获取分类树）
```

### 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/products` | 列表页 | 搜索、筛选、批量操作 |
| `/products/new` | 编辑页 | 新建模式，复用 `[id]/page.tsx` |
| `/products/:id` | 编辑页 | 编辑模式 |

---

## 类型定义

```typescript
// types.ts

/** 商品基础信息 */
interface ProductBasicInfo {
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

/** 商品表单完整数据 */
interface ProductFormData {
  basic: ProductBasicInfo;
  skcs: SkcGroup[];
  variants: ProductVariantItem[];
  meta: Record<string, unknown>;
}

/** SKC 颜色组（含图片） */
interface SkcGroup {
  id?: number;
  color: string;           // 颜色名称
  color_hex: string;       // #RRGGBB
  sort: number;
  images: ProductImageItem[];
}

interface ProductImageItem {
  id?: number;
  url: string;
  alt: string;
  sort: number;
  is_primary: boolean;
}

/** SKU 变体 */
interface ProductVariantItem {
  id?: number;
  sku: string;             // 自动生成：{slug}-{color缩写}-{size}
  color: string;
  size: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}
```

---

## 列表页

### 布局

```
┌─────────────────────────────────────────────────────┐
│  商品管理                              [+ 添加商品]  │
│                                                       │
│  [全部] [草稿] [在售] [下架]    🔍 搜索商品名称...    │
│  ┌──────────┐                                        │
│  │ 全部分类 ▼│  已选 3 项   [批量上架] [批量下架]      │
│  └──────────┘                                        │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ☐ │ 图片 │ 商品名称 │ 分类 │ 价格 │ 状态 │ ... │ │
│  │ ─────────────────────────────────────────────── │ │
│  │ ☐ │ 🖼  │ 波点连衣裙│ 连衣裙│ 89→69│ 在售 │ ... │ │
│  │ ☐ │ 🖼  │ 亚麻衬衫  │ 上衣 │  59  │ 草稿 │ ... │ │
│  │                                                 │ │
│  │        < 1 2 3 ... 10 >  共 200 条              │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 操作栏

| 组件 | 说明 |
|------|------|
| 状态 Tabs | 全部 / 草稿 / 在售 / 下架，单选切换，复用 colors 页的 tab 样式 |
| 搜索框 | 受控 input，防抖 300ms，页码重置为 1 |
| 分类下拉 | 多选下拉，支持两级分类（父类分组 + 子类可选） |
| 批量操作栏 | 选中行后显示「已选 N 项」「批量上架」「批量下架」「批量删除」 |

### 表格列

| 列 | 宽度 | 内容 |
|----|------|------|
| ☐ checkbox | 40px | 批量选择，表头全选当前页 |
| 图片 | 64px | 主图缩略图，无图时灰色占位 |
| 商品名称 | 自适应 | name + slug（小字灰色），点击进入编辑页 |
| 分类 | 120px | category 名称 |
| 价格 | 120px | 售价（大字）/ 原价（划线小字灰色） |
| 状态 | 80px | Badge：草稿灰 / 在售绿 / 下架红 |
| 创建时间 | 140px | YYYY-MM-DD HH:mm |
| 操作 | 100px | 编辑 / 删除（二次确认按钮组） |

### 交互

- 搜索防抖 300ms，任一筛选条件变化 → 页码重置为 1
- 整行点击（除操作列外）→ 进入 `/products/:id`
- 删除确认：点删除→显示「确认」「取消」按钮组（复用 colors 页模式）
- 批量操作：全选仅选当前页，跨页不做（简化）
- 移动端：卡片列表 + 简化分页（复用 MobileColorCard 模式）
- 加载/空/错误状态均有覆盖

---

## 编辑页

### 整体结构

```
┌─────────────────────────────────────────────────────────┐
│  ← 返回列表    编辑商品：波点连衣裙          [保存]      │
│                                                         │
│  [基础信息] [颜色图片] [SKU变体] [扩展信息]              │
│  ──────────────────────────────────────────────────────  │
│                                                         │
│  Tab 内容区域（根据选中 Tab 渲染对应组件）                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- 顶部栏：返回箭头 + 商品名称（新建展示"新建商品"）+ 保存按钮（sticky 顶部）
- Tab 栏：4 个 Tab 切换，样式复用列表页的状态筛选组件
- 保存时收集全部 Tab 数据 → 整体校验 → 调用 API

### Tab 1：基础信息

标准表单布局：

| 字段 | 控件 | 校验 |
|------|------|------|
| 商品名称 | text input | 必填，max 255 |
| Slug | text input | 必填，唯一 |
| 描述 | textarea（3行） | 可选 |
| 分类 | 下拉选择（两级） | 必选 |
| 原价 | number input + USD 后缀 | 必填，>=0 |
| 售价 | number input + USD 后缀 | 可选，>=0 |
| 成本价 | number input + USD 后缀 | 可选，>=0 |
| 状态 | Tab 切换：草稿/在售/下架 | 必选 |
| 排序 | number input | 默认 0 |

### Tab 2：颜色 + 图片

```
┌──────────────────────────────────────────────┐
│  颜色组                    [+ 添加颜色]       │
│                                               │
│  ┌─ Scarlet Red #CC0000 ──── [展开/折叠] ─┐  │
│  │  [🖼] [🖼] [🖼] [🖼] [+ 添加图片]       │  │
│  │   ☉主  ☉     ☉     ☉                    │  │
│  │  排序 [0]                    [删除颜色]   │  │
│  └──────────────────────────────────────────┘  │
│                                               │
│  ┌─ Navy Blue #1A1A4E ────────────────────┐  │
│  │  ...                                     │  │
│  └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

- 颜色组卡片列表，每个卡片可展开/折叠
- 颜色字段：名称（text）、色值（text + color picker，复用 colors 页模式）、排序
- 图片列表：横向排列，点击放大，可设为主图（radio）、删除
- 图片添加：URL 输入 + 预览（上传由后端单独处理，此处用 URL）
- 新建 SKC：弹出轻量表单（颜色名 + 色值）

### Tab 3：SKU 变体矩阵

```
┌──────────────────────────────────────────────┐
│          │  S   │  M   │  L   │  XL  │        │
│  ────────┼──────┼──────┼──────┼──────┼────────│
│  Red     │89.00 │89.00 │89.00 │89.00 │        │
│          │ 5件  │ 8件  │ 3件  │ 0件  │        │
│  ────────┼──────┼──────┼──────┼──────┼────────│
│  Navy    │89.00 │89.00 │  —   │  —   │        │
│          │ 2件  │ 6件  │      │      │        │
│                                               │
│  [+ 添加尺码列]  [+ 添加颜色行]                 │
└──────────────────────────────────────────────┘
```

- 矩阵视图：行为颜色（自动同步 Tab 2 的 SKC），列为尺码
- 每格内：价格（可编辑数字）+ 库存（可编辑数字），无变体的格显示"—"
- SKU 编码自动生成：`{商品slug}-{颜色缩写}-{尺码}`
- 批量填充：选中多个单元格 → 输入值 → 统一填入
- 尺码预设：XS / S / M / L / XL / XXL，可自定义添加
- 变体不能超过 Tab 2 的颜色范围（颜色一致性校验）

### Tab 4：扩展信息

- Textarea 编辑自由 JSON，等宽字体（`font-mono`）
- 「格式化」按钮 → `JSON.stringify(JSON.parse(...), null, 2)`
- 「校验 JSON」按钮 → try-catch parse，成功显示绿色提示，失败显示错误行号
- 不预设 schema，完全自由

### 保存流程

```
点击 [保存]
  → 收集全部 4 个 Tab 的表单数据
  → 校验基础信息必填项
  → 新建：POST /admin/products
  → 编辑：PUT /admin/products/:id
  → 成功：toast 提示 + 返回列表页
  → 失败：toast 错误信息 + 高亮有错误的 Tab
```

---

## API 层

### 类型

```typescript
// lib/api/products.ts

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  base_price: number;
  sale_price: number | null;
  status: 'draft' | 'active' | 'inactive';
  image: string | null;
  created_at: string;
}

interface AdminProductDetail extends AdminProduct {
  description: string | null;
  cost_price: number | null;
  sort: number;
  meta: Record<string, unknown> | null;
  images: AdminProductImage[];
  variants: AdminVariant[];
}

interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category_id?: number;
}
```

### 方法

| 方法 | 端点 | 说明 |
|------|------|------|
| `getProducts(token, params)` | `GET /admin/products` | 列表，返回 `{ data, meta }` |
| `getProduct(token, id)` | `GET /admin/products/:id` | 详情，含 variants + images |
| `createProduct(token, data)` | `POST /admin/products` | 新建 |
| `updateProduct(token, id, data)` | `PUT /admin/products/:id` | 更新 |
| `deleteProduct(token, id)` | `DELETE /admin/products/:id` | 软删除 |
| `batchUpdateStatus(token, ids, status)` | 逐条 `PUT /admin/products/:id` | 批量状态 |
| `batchDelete(token, ids)` | 逐条 `DELETE /admin/products/:id` | 批量删除 |
| `getCategories(token)` | `GET /admin/categories` | 分类树（用于筛选和表单） |

---

## 状态管理

### 列表页：useProducts hook

```typescript
function useProducts() {
  // 列表状态
  products, total, page, pageSize, loading, error
  // 筛选状态
  statusFilter, search, categoryFilter
  // 批量操作
  selectedIds, setSelectedIds
  batchUpdateStatus(), batchDelete()
  // 删除
  deletingId, handleDelete, setDeletingId
  // 操作
  setStatusFilter(), setSearch(), setCategoryFilter()
  handlePageChange()
}
```

### 编辑页：useProductDetail hook

```typescript
function useProductDetail(id: number | 'new') {
  product, loading, error
  activeTab, setActiveTab
  form: ProductFormData, setForm
  saving, saveError
  
  loadProduct()    // 编辑模式：GET /admin/products/:id
  handleSave()     // 收集数据 → 校验 → POST/PUT → 返回列表
}
```

每个 Tab 组件接收 `{ form, setForm }` 或对应的子数据切片，只负责自己 Tab 的 UI 渲染和局部状态更新。

---

## 视觉风格

- 完全统一现有后台风格：`bg-gray-50` 背景、`bg-sidebar (#1E1E2D)` 侧边栏、`primary (#4F6EF7)` 主色调
- Tab 切换、Badge、按钮、分页等全部复用 colors 页既有的 Tailwind class 组合
- 字体：`-apple-system, BlinkMacSystemFont, PingFang SC, Segoe UI, system-ui, sans-serif`
- 移动端响应式：`<md` 隐藏表格 → 显示卡片列表；`>=md` 显示表格
- 编辑页在移动端：Tab 标签页水平排列，表单全宽

---

## 不限范围

- 图片上传（后端 OSS 对接待定，当前用 URL 输入）
- 批量导入/导出
- 商品复制功能
- 操作日志/版本历史
