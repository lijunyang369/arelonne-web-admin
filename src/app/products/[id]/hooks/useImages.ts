/**
 * 商品编辑页 — SKC 颜色组 + 图片管理逻辑。
 * 所有更新均使用函数式 setForm(prev => ...)，避免异步回调（如上传完成）基于旧 form 快照覆盖并发编辑。
 */

import type { Dispatch, SetStateAction } from 'react';
import type { SkcGroup, ProductImageItem, ProductFormData } from '../../types';

interface UseImagesReturn {
  /** 添加新颜色组 */
  addSkc: () => void;
  /** 删除颜色组 */
  removeSkc: (index: number) => void;
  /** 更新颜色组字段 */
  updateSkc: (index: number, partial: Partial<SkcGroup>) => void;
  /** 切换展开/折叠 */
  toggleSkc: (index: number) => void;
  /** 添加图片到指定颜色组 */
  addImage: (skcIndex: number) => void;
  /** 删除图片 */
  removeImage: (skcIndex: number, imageIndex: number) => void;
  /** 更新图片字段 */
  updateImage: (skcIndex: number, imageIndex: number, partial: Partial<ProductImageItem>) => void;
  /** 设置主图 */
  setPrimaryImage: (skcIndex: number, imageIndex: number) => void;
}

export function useImages(
  form: ProductFormData,
  setForm: Dispatch<SetStateAction<ProductFormData>>,
): UseImagesReturn {
  const addSkc = () => {
    setForm((prev) => {
      const newSkc: SkcGroup = {
        color: '', color_hex: '#4F6EF7', sort: prev.skcs.length, images: [], expanded: true,
      };
      return { ...prev, skcs: [...prev.skcs, newSkc] };
    });
  };

  const removeSkc = (index: number) => {
    setForm((prev) => {
      const skcs = prev.skcs.filter((_, i) => i !== index);
      return { ...prev, skcs };
    });
  };

  const updateSkc = (index: number, partial: Partial<SkcGroup>) => {
    setForm((prev) => {
      const skcs = prev.skcs.map((s, i) => i === index ? { ...s, ...partial } : s);
      return { ...prev, skcs };
    });
  };

  const toggleSkc = (index: number) => {
    setForm((prev) => {
      const skcs = prev.skcs.map((s, i) => i === index ? { ...s, expanded: !s.expanded } : s);
      return { ...prev, skcs };
    });
  };

  const addImage = (skcIndex: number) => {
    setForm((prev) => {
      const newImage: ProductImageItem = { url: '', thumb_url: '', alt: '', sort: prev.skcs[skcIndex].images.length, is_primary: false };
      const skcs = prev.skcs.map((s, i) =>
        i === skcIndex ? { ...s, images: [...s.images, newImage] } : s
      );
      return { ...prev, skcs };
    });
  };

  const removeImage = (skcIndex: number, imageIndex: number) => {
    setForm((prev) => {
      const skcs = prev.skcs.map((s, i) =>
        i === skcIndex ? { ...s, images: s.images.filter((_, j) => j !== imageIndex) } : s
      );
      return { ...prev, skcs };
    });
  };

  const updateImage = (skcIndex: number, imageIndex: number, partial: Partial<ProductImageItem>) => {
    setForm((prev) => {
      const skcs = prev.skcs.map((s, i) =>
        i === skcIndex ? {
          ...s,
          images: s.images.map((img, j) => j === imageIndex ? { ...img, ...partial } : img),
        } : s
      );
      return { ...prev, skcs };
    });
  };

  const setPrimaryImage = (skcIndex: number, imageIndex: number) => {
    setForm((prev) => {
      const skcs = prev.skcs.map((s, i) =>
        i === skcIndex ? {
          ...s,
          images: s.images.map((img, j) => ({ ...img, is_primary: j === imageIndex })),
        } : s
      );
      return { ...prev, skcs };
    });
  };

  return { addSkc, removeSkc, updateSkc, toggleSkc, addImage, removeImage, updateImage, setPrimaryImage };
}
