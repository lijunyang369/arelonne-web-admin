'use client';

/**
 * 系统设置页 — 运费规则编辑。
 */

import { useEffect, useState, useCallback } from 'react';
import { getSettings, updateSettings } from '@/lib/api/settings';

// 各页面统一从 localStorage 读取 admin token（与 products/colors 页一致）
const TOKEN_KEY = 'hope_admin_token';

export default function SettingsPage() {
  const [freeThreshold, setFreeThreshold] = useState('50');
  const [shippingFee, setShippingFee] = useState('5.99');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 加载现有设置
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY) ?? '';
    getSettings(token, 'shipping')
      .then((items) => {
        for (const item of items) {
          if (item.key === 'shipping.free_threshold') setFreeThreshold(item.value);
          if (item.key === 'shipping.fee') setShippingFee(item.value);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }, []);

  // 保存
  const handleSave = useCallback(async () => {
    if (loadError) return;
    const token = localStorage.getItem(TOKEN_KEY) ?? '';
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings(token, [
        { key: 'shipping.free_threshold', value: freeThreshold },
        { key: 'shipping.fee', value: shippingFee },
      ]);
      setSaved(true);
    } catch {
      // 保存失败时给出可见反馈（表单保留输入值，用户可重试）
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [freeThreshold, shippingFee, loadError]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 lg:text-2xl">系统设置</h1>
      <div className="space-y-6">
        {loadError && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            设置加载失败，为避免覆盖现有配置，请刷新页面重试。
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-white">
          <h2 className="border-b px-5 py-4 text-sm font-semibold text-gray-700">配送设置</h2>
          <div className="space-y-5 px-5 py-5">
            <label className="flex items-center justify-between text-sm">
              <span className="text-gray-500">免运费门槛（USD）</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={freeThreshold}
                onChange={(e) => {
                  setFreeThreshold(e.target.value);
                  setSaved(false);
                }}
                className="w-32 rounded border border-gray-300 px-3 py-1.5 text-right text-gray-900 focus:border-gray-500 focus:outline-none"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="text-gray-500">标准运费（USD）</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingFee}
                onChange={(e) => {
                  setShippingFee(e.target.value);
                  setSaved(false);
                }}
                className="w-32 rounded border border-gray-300 px-3 py-1.5 text-right text-gray-900 focus:border-gray-500 focus:outline-none"
              />
            </label>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              {saved && <span className="text-sm text-green-600">已保存</span>}
              {(!freeThreshold.trim() || !shippingFee.trim()) && (
                <span className="text-sm text-amber-600">请输入运费门槛与运费金额</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || loading || loadError || !freeThreshold.trim() || !shippingFee.trim()}
                className="rounded bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
