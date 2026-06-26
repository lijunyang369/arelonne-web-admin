export default function ProductsPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">商品管理</h1>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="text-sm text-gray-500">共 0 件商品</p>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors">
            添加商品
          </button>
        </div>
        <p className="px-5 py-12 text-center text-sm text-gray-400">商品管理功能开发中……</p>
      </div>
    </div>
  );
}
