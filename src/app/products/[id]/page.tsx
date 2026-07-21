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
