# Table

通用数据表格组件。原生 HTML `<table>` + `<colgroup>`，支持客户端/服务端分页、加载态、空状态。

**文件**：`src/components/shared/Table.tsx`
**类型**：客户端组件（`'use client'`）

## 何时使用

- 后台列表页的数据展示
- 需要标题行 + 分页时

## Props

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `columns` | `Column<T>[]` | ✓ | — | 列定义 |
| `data` | `T[]` | ✓ | — | 数据源 |
| `keyExtractor` | `(item: T) => string \| number` | ✓ | — | 提取唯一 key |
| `pageSize` | `number` | ✗ | `20` | 每页条数 |
| `total` | `number` | ✗ | — | 服务端分页：数据总数；不传则客户端分页 |
| `onPageChange` | `(page, pageSize) => void` | ✗ | — | 服务端分页：翻页回调 |
| `currentPage` | `number` | ✗ | — | 服务端分页：受控页码 |
| `currentPageSize` | `number` | ✗ | — | 服务端分页：受控每页条数 |
| `loading` | `boolean` | ✗ | `false` | 加载中 |
| `emptyText` | `string` | ✗ | `"暂无数据"` | 空数据提示 |

### Column\<T\>

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | `string` | ✓ | 列标识（用作 key + 默认取值字段名） |
| `title` | `string` | ✓ | 列标题 |
| `render` | `(item: T) => ReactNode` | ✗ | 自定义渲染；不传则取 `item[key]` 文本展示 |
| `className` | `string` | ✗ | 列容器额外样式（响应式可见性等） |
| `align` | `'left' \| 'center' \| 'right'` | ✗ | 对齐，默认左对齐。通过 `<th>`/`<td>` inline style 生效 |
| `width` | `string` | ✗ | 固定列宽（如 `'60px'`），通过 `<colgroup>` 强制生效 |

## 基本用法

```tsx
import { Table } from '@/components/shared/Table';
import type { Column } from '@/components/shared/Table';

interface User {
  id: number;
  name: string;
  role: string;
}

const columns: Column<User>[] = [
  { key: 'name', title: '姓名' },
  { key: 'role', title: '角色', width: '100px', align: 'center' },
];

<Table
  columns={columns}
  data={users}
  keyExtractor={(u) => u.id}
/>
```

## 服务端分页

```tsx
<Table
  columns={columns}
  data={items}
  total={totalCount}
  currentPage={page}
  currentPageSize={pageSize}
  onPageChange={(page, pageSize) => fetchPage(page, pageSize)}
  keyExtractor={(i) => i.id}
/>
```

## 布局说明

原生 `<table>` 元素 + `table-fixed`（`table-layout: fixed`）+ `<colgroup>` 定义列宽。

- **自适应列**：不设 `width`，等分剩余空间
- **固定列**：设 `width`（如 `'72px'`），通过 `<col>` 强制生效
- **不换行**：`className: 'whitespace-nowrap'`
- **响应式可见性**：`className: 'hidden sm:table-cell'`（移动端隐藏 `hidden` → 对应断点 `table-cell`）

## 对齐

通过 `align` 属性，使用 inline style 保证覆盖 `<th>` 浏览器默认居中。块级子元素（`<div>` 等）需要自行 `inline-block` 或 `mx-auto` 配合居中。

## 分页

- **客户端模式**（不传 `total`）：组件内部 slice，`data` 变化自动回第一页
- **服务端模式**（传 `total` + `currentPage` + `currentPageSize` + `onPageChange`）：完全受控，页码/每页条数由父组件管理，Table 只负责渲染和回调
- 底部：条数范围 + 每页条数选择 + 页码按钮
- 页码 ≤ 7 全显示，超过时首尾 + 省略号
- 每页可选：10 / 20 / 50 / 100

## 移动端

Table 在移动端（< 768px）列多会被压缩，不适合直接缩小。推荐 **桌面端表格 + 移动端卡片列表** 的双视图模式：

```tsx
// 桌面端
<div className="hidden md:block">
  <Table columns={columns} data={items} total={total} ... />
</div>

// 移动端：卡片列表 + 简易分页
<div className="md:hidden">
  {items.map(item => (
    <ColorCard key={item.id} item={item} onEdit={...} onDelete={...} />
  ))}
  <MobilePagination page={page} totalPages={...} onPageChange={...} />
</div>
```

### 移动端卡片设计要点

- 卡片结构：主信息行 → 辅助信息行 → 操作行，每行用 `border-t` 分隔
- 色块/状态等标识元素保持在卡片左侧或右上角，信息层级清晰
- 分页简化为「上一页 + N/M + 下一页」，只保留核心操作
- 加载态和空状态与桌面端保持一致

**参考实现**：`src/app/colors/MobileColorCard.tsx` + `useColors.ts`。
