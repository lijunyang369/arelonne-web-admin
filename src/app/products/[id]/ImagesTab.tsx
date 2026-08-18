'use client';

/**
 * 商品编辑页 — Tab 2：SKC 颜色组 + 图片管理。
 */

import { useImages } from './hooks/useImages';
import type { ProductFormData } from '../types';
import { imageUrl } from '@/lib/api/client';
import { ImageUploadButton } from '@/components/ImageUploadButton';

interface ImagesTabProps {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
}

export function ImagesTab({ form, setForm }: ImagesTabProps) {
  const { addSkc, removeSkc, updateSkc, toggleSkc, addImage, removeImage, updateImage, setPrimaryImage } = useImages(form, setForm);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">管理商品的颜色组和对应图片</p>
        <button type="button" onClick={addSkc}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover">
          + 添加颜色
        </button>
      </div>

      {form.skcs.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">暂无颜色组，点击「添加颜色」创建</p>
      )}

      <div className="space-y-3">
        {form.skcs.map((skc, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/50">
            {/* 颜色头部 */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => toggleSkc(i)}>
              <div className="h-6 w-6 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: skc.color_hex }} />
              <input type="text" value={skc.color} placeholder="颜色名称"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateSkc(i, { color: e.target.value })}
                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none" />
              <div className="flex items-center gap-1">
                <input type="text" value={skc.color_hex} maxLength={7}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSkc(i, { color_hex: e.target.value })}
                  placeholder="#RRGGBB"
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-xs font-mono focus:border-gray-900 focus:outline-none" />
                <input type="color" value={skc.color_hex}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSkc(i, { color_hex: e.target.value })}
                  className="h-7 w-7 cursor-pointer rounded border border-gray-300" />
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-gray-400">排序</span>
                <input type="number" min={0} value={skc.sort}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSkc(i, { sort: Number(e.target.value) })}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none" />
                <button type="button" onClick={(e) => { e.stopPropagation(); removeSkc(i); }}
                  className="ml-2 rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50">
                  删除
                </button>
              </div>
              <span className="text-xs text-gray-300">{skc.expanded ? '▲' : '▼'}</span>
            </div>

            {/* 展开的图片列表 */}
            {skc.expanded && (
              <div className="border-t border-gray-200 px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  {skc.images.map((img, j) => (
                    <div key={j} className="relative w-28 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2">
                      {img.url ? (
                        <img src={imageUrl(img.thumb_url || img.url)!} alt={img.alt || skc.color}
                          className="mb-2 h-24 w-full rounded object-cover" />
                      ) : (
                        <div className="mb-2 flex h-24 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-300">
                          无图片
                        </div>
                      )}
                      <input type="text" value={img.url} placeholder="图片 URL"
                        onChange={(e) => updateImage(i, j, { url: e.target.value })}
                        className="mb-1 block w-full rounded border border-gray-200 px-1.5 py-0.5 text-xs focus:border-gray-900 focus:outline-none" />
                      <ImageUploadButton
                        onUploaded={(url, thumbUrl) => updateImage(i, j, { url, thumb_url: thumbUrl })}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                          <input type="radio" name={`primary-${i}`} checked={img.is_primary}
                            onChange={() => setPrimaryImage(i, j)}
                            className="h-3 w-3" />
                          主图
                        </label>
                        <button type="button" onClick={() => removeImage(i, j)}
                          className="text-xs text-red-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addImage(i)}
                    className="flex h-[148px] w-28 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500">
                    + 添加图片
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
