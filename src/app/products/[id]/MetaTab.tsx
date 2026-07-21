'use client';

/**
 * 商品编辑页 — Tab 4：扩展信息（自由 JSON 编辑）。
 */

import { useState } from 'react';
import type { ProductFormData } from '../types';

interface MetaTabProps {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
}

export function MetaTab({ form, setForm }: MetaTabProps) {
  const [text, setText] = useState(() =>
    Object.keys(form.meta).length > 0 ? JSON.stringify(form.meta, null, 2) : ''
  );
  const [parseError, setParseError] = useState<string | null>(null);

  /** 格式化 JSON */
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(text || '{}');
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setParseError('JSON 必须是对象类型，不能是 null、数组或标量');
        return;
      }
      const formatted = JSON.stringify(parsed, null, 2);
      setText(formatted);
      setForm({ ...form, meta: parsed });
      setParseError(null);
    } catch (e) {
      setParseError(`JSON 格式错误：${(e as Error).message}`);
    }
  };

  /** 校验 JSON */
  const handleValidate = () => {
    try {
      JSON.parse(text || '{}');
      setParseError(null);
      alert('JSON 格式正确 ✓');
    } catch (e) {
      setParseError(`JSON 格式错误：${(e as Error).message}`);
    }
  };

  /** 内容变更时同步到 form */
  const handleChange = (value: string) => {
    setText(value);
    try {
      const parsed = JSON.parse(value || '{}');
      // 仅接受对象类型，拒绝 null / 数组 / 标量
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return;
      }
      setForm({ ...form, meta: parsed });
      setParseError(null);
    } catch {
      // 编辑过程中可能不完整，不同步但也不报错
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          自由 JSON 扩展字段，如面料、尺码表、洗护说明等
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleFormat}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50">
            格式化
          </button>
          <button type="button" onClick={handleValidate}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50">
            校验 JSON
          </button>
        </div>
      </div>

      {parseError && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600 font-mono">{parseError}</div>
      )}

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`{\n  "fabric": "100% Cotton",\n  "care": "Machine wash cold"\n}`}
        rows={16}
        className="block w-full rounded-md border border-gray-300 px-4 py-3 font-mono text-sm shadow-sm focus:border-gray-900 focus:outline-none resize-y"
        spellCheck={false}
      />
    </div>
  );
}
