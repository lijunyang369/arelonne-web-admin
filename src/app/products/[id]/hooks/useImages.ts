/**
 * 商品编辑页 — SKC 颜色组 + 图片管理逻辑。
 */

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
  setForm: (f: ProductFormData) => void,
): UseImagesReturn {
  const addSkc = () => {
    const newSkc: SkcGroup = {
      color: '', color_hex: '#4F6EF7', sort: form.skcs.length, images: [], expanded: true,
    };
    setForm({ ...form, skcs: [...form.skcs, newSkc] });
  };

  const removeSkc = (index: number) => {
    const skcs = form.skcs.filter((_, i) => i !== index);
    setForm({ ...form, skcs });
  };

  const updateSkc = (index: number, partial: Partial<SkcGroup>) => {
    const skcs = form.skcs.map((s, i) => i === index ? { ...s, ...partial } : s);
    setForm({ ...form, skcs });
  };

  const toggleSkc = (index: number) => {
    const skcs = form.skcs.map((s, i) => i === index ? { ...s, expanded: !s.expanded } : s);
    setForm({ ...form, skcs });
  };

  const addImage = (skcIndex: number) => {
    const newImage: ProductImageItem = { url: '', thumb_url: '', alt: '', sort: form.skcs[skcIndex].images.length, is_primary: false };
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? { ...s, images: [...s.images, newImage] } : s
    );
    setForm({ ...form, skcs });
  };

  const removeImage = (skcIndex: number, imageIndex: number) => {
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? { ...s, images: s.images.filter((_, j) => j !== imageIndex) } : s
    );
    setForm({ ...form, skcs });
  };

  const updateImage = (skcIndex: number, imageIndex: number, partial: Partial<ProductImageItem>) => {
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? {
        ...s,
        images: s.images.map((img, j) => j === imageIndex ? { ...img, ...partial } : img),
      } : s
    );
    setForm({ ...form, skcs });
  };

  const setPrimaryImage = (skcIndex: number, imageIndex: number) => {
    const skcs = form.skcs.map((s, i) =>
      i === skcIndex ? {
        ...s,
        images: s.images.map((img, j) => ({ ...img, is_primary: j === imageIndex })),
      } : s
    );
    setForm({ ...form, skcs });
  };

  return { addSkc, removeSkc, updateSkc, toggleSkc, addImage, removeImage, updateImage, setPrimaryImage };
}
