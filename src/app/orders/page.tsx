export default function OrdersPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">订单管理</h1>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-4 border-b px-5 py-4">
          {['全部', '待处理', '已发货', '已完成'].map((t) => (
            <button key={t}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                t === '全部' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>{t}</button>
          ))}
        </div>
        <p className="px-5 py-12 text-center text-sm text-gray-400">订单管理功能开发中……</p>
      </div>
    </div>
  );
}
