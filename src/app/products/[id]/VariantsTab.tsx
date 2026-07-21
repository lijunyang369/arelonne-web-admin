'use client';

/**
 * 商品编辑页 — Tab 3：SKU 变体矩阵（颜色×尺码）。
 */

import { useState } from 'react';
import { useVariants } from './hooks/useVariants';
import type { ProductFormData } from '../types';

interface VariantsTabProps {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
}

export function VariantsTab({ form, setForm }: VariantsTabProps) {
  const { sizes, addSize, removeSize, getVariant, updateVariant, batchFill } = useVariants(form, setForm);
  const [newSize, setNewSize] = useState('');

  const colors = form.skcs.map((s) => s.color).filter(Boolean);

  // 批量选择状态
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const cellKey = (color: string, size: string) => `${color}::${size}`;

  const toggleCell = (color: string, size: string) => {
    setSelectedCells((prev) => {
      const next = new Set(prev);
      const key = cellKey(color, size);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleBatchPrice = () => {
    const cells = Array.from(selectedCells).map((k) => {
      const [color, size] = k.split('::');
      return { color, size };
    });
    const price = prompt('输入统一价格 (USD):');
    if (price && !isNaN(Number(price))) {
      batchFill(cells, { price: Number(price) });
      setSelectedCells(new Set());
    }
  };

  const handleBatchStock = () => {
    const cells = Array.from(selectedCells).map((k) => {
      const [color, size] = k.split('::');
      return { color, size };
    });
    const stock = prompt('输入统一库存:');
    if (stock && !isNaN(Number(stock))) {
      batchFill(cells, { stock: Number(stock) });
      setSelectedCells(new Set());
    }
  };

  if (colors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        请先在「颜色图片」Tab 中添加颜色组，变体矩阵自动同步
      </p>
    );
  }

  return (
    <div>
      {/* 尺码管理 + 批量填充 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {sizes.map((size) => (
            <span key={size} className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
              {size}
              <button type="button" onClick={() => removeSize(size)}
                className="text-gray-300 hover:text-red-500">×</button>
            </span>
          ))}
          <div className="flex items-center gap-0.5">
            <input type="text" value={newSize} placeholder="新尺码"
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { addSize(newSize); setNewSize(''); } }}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none" />
            <button type="button" onClick={() => { addSize(newSize); setNewSize(''); }}
              className="rounded border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-400 hover:border-gray-400">
              +
            </button>
          </div>
        </div>

        {selectedCells.size > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">已选 {selectedCells.size} 格</span>
            <button type="button" onClick={handleBatchPrice}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
              统一价格
            </button>
            <button type="button" onClick={handleBatchStock}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
              统一库存
            </button>
          </div>
        )}
      </div>

      {/* 矩阵表格 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">颜色</th>
              {sizes.map((size) => (
                <th key={size} className="border-b border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-500 min-w-[100px]">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr key={color}>
                <td className="sticky left-0 bg-white border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-900">
                  {color}
                </td>
                {sizes.map((size) => {
                  const v = getVariant(color, size);
                  const selected = selectedCells.has(cellKey(color, size));
                  return (
                    <td key={size} className={`border-b border-gray-100 px-2 py-2 ${selected ? 'bg-blue-50/50' : ''}`}
                      onClick={() => toggleCell(color, size)}>
                      {v ? (
                        <div className="space-y-1 cursor-pointer">
                          <input type="number" min={0} step="0.01" value={v.price}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateVariant(color, size, { price: Number(e.target.value) })}
                            className="block w-full rounded border border-gray-200 px-2 py-1 text-xs text-center focus:border-gray-900 focus:outline-none"
                            placeholder="价格" />
                          <input type="number" min={0} step="1" value={v.stock}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateVariant(color, size, { stock: Number(e.target.value) })}
                            className="block w-full rounded border border-gray-200 px-2 py-1 text-xs text-center focus:border-gray-900 focus:outline-none"
                            placeholder="库存" />
                        </div>
                      ) : (
                        <div className="py-3 text-center text-xs text-gray-300 cursor-pointer">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
