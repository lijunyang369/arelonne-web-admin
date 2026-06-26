export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">仪表盘</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="商品总数" value="—" />
        <StatCard label="今日订单" value="—" />
        <StatCard label="总收入" value="—" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
