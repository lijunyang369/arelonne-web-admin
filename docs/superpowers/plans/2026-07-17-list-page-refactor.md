# 列表页规范对齐 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 将 colors 和 products 模块对齐到列表页规范，作为后续所有列表页的标准样板。

**Architecture:** 重命名 + 改字段名 + 改 prop 名，不动任何业务逻辑。所有改动内部一致，两个模块互不影响。

**Tech Stack:** Next.js 14, TypeScript, Tailwind

## Global Constraints

- 不引入新依赖
- 不改变任何业务逻辑、UI、交互行为
- hooks 内部 state 名允许不改（本地变量不对外）
- 只改导出名、props 名、文件名
- 函数必须带中文注释

---

### Task 1: 重命名 colors 模块

**Files:**
- Rename: `useColors.ts` → `useColorList.ts`
- Modify: `useColorList.ts` — hook 函数名 `useColors` → `useColorList`，数据字段 `colors` → `items`
- Modify: `page.tsx` — 更新 import + 解构
- Modify: `MobileColorCard.tsx` — props `colors` → `items`
- Modify: `columns.tsx` — 如引用了 hook 名则更新

**Changes:**

- [ ] **Step 1: 重命名文件**

```bash
cd /var/www/arelonne/web-admin
mv src/app/colors/useColors.ts src/app/colors/useColorList.ts
```

- [ ] **Step 2: 修改 useColorList.ts — 函数名 + 字段名**

```typescript
// 改
export function useColors() {
// →
export function useColorList() {

// 内部 state 名 colors 保持不动（本地变量），但返回对象中改：
return {
  // 列表
  items: colors,   // ← colors → items
  // ...
};
```

- [ ] **Step 3: 修改 page.tsx**

```typescript
// import
import { useColorList } from './useColorList';

// 解构
const {
  items, total, page, pageSize, loading, error, statusFilter,  // colors → items
  // ...其余不变
} = useColorList();

// Table data prop
<Table data={items} ... />    // colors → items

// MobileColorCard prop
<MobileColorCard items={items} ... />  // colors → items (组件内部同步改)
```

- [ ] **Step 4: 修改 MobileColorCard.tsx — prop 名**

```typescript
// interface 中
colors: AdminColor[];  // → items: AdminColor[];

// 组件内所有引用
{colors.map(...)}  →  {items.map(...)}
{colors.length}    →  {items.length}
```

- [ ] **Step 5: 提交**

```bash
git add src/app/colors/
git commit -m "refactor: align colors module to list page standard"
```

---

### Task 2: 重命名 products 模块

**Files:**
- Rename: `useProducts.ts` → `useProductList.ts`
- Modify: `useProductList.ts` — hook 函数名 `useProducts` → `useProductList`，数据字段 `products` → `items`
- Modify: `page.tsx` — 更新 import + 解构
- Modify: `MobileProductCard.tsx` — props `products` → `items`
- Modify: `columns.tsx` — 如引用了 hook 名则更新

**Changes:**

- [ ] **Step 1: 重命名文件**

```bash
mv src/app/products/useProducts.ts src/app/products/useProductList.ts
```

- [ ] **Step 2: 修改 useProductList.ts — 函数名 + 字段名**

```typescript
export function useProducts() {    // → useProductList
  // 内部 state 名 products 保持不动
  return {
    items: products,    // products → items
    // ...
  };
}
```

- [ ] **Step 3: 修改 page.tsx**

```typescript
import { useProductList } from './useProductList';

const {
  items, total, page, pageSize, loading, error,    // products → items
  // ...
} = useProductList();

// Table
<Table data={items} ... />

// MobileProductCard
<MobileProductCard items={items} ... />
```

- [ ] **Step 4: 修改 MobileProductCard.tsx — prop 名**

```typescript
products: AdminProduct[];  // → items: AdminProduct[];
{products.map(...)} → {items.map(...)}
{products.length} → {items.length}
```

- [ ] **Step 5: 提交**

```bash
git add src/app/products/
git commit -m "refactor: align products module to list page standard"
```

---

### Task 3: 验证

- [ ] **Step 1: TypeScript**

```bash
cd /var/www/arelonne/web-admin && npx tsc --noEmit
```

预期：0 errors

- [ ] **Step 2: 检查 grep — 确认无遗漏引用**

```bash
# products 模块中不应再有 exports useProducts 引用
grep -r "useProducts\|useColors" src/app/products/ src/app/colors/ --include="*.ts" --include="*.tsx"

# 确认 items 已全局替换
grep -r "={.*colors}\|={.*products}" src/app/products/page.tsx src/app/colors/page.tsx
```

- [ ] **Step 3: 运行 dev server 验证**

```bash
npm run dev -- -p 3001
```

访问 `/products` 和 `/colors` 确认功能正常。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: verify list page standard compliance"
```
