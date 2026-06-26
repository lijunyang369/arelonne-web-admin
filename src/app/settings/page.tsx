export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">系统设置</h1>
      <div className="space-y-6">
        <Section title="基本信息">
          <Field label="站点名称" value="HOPE" />
          <Field label="站点描述" value="Affordable Quality Womenswear" />
          <Field label="管理员邮箱" value="admin@hope.com" />
        </Section>
        <Section title="配送设置">
          <Field label="免运费门槛" value="$50.00" />
          <Field label="标准运费" value="$5.99" />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <h2 className="border-b px-5 py-4 text-sm font-semibold text-gray-700">{title}</h2>
      <div className="divide-y px-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
