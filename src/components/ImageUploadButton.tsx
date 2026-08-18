/**
 * 图片上传按钮：选择 → presign → 直传 → confirm → 回调 URL。
 * 形态（frontend-design 确认稿）：简洁按钮 + 自动填入；
 * 上传中显示忙碌状态（fetch 不提供真实百分比，不做进度条）；失败显示错误提示行。
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { uploadImage } from '@/lib/api/uploads';

interface ImageUploadButtonProps {
  /** 上传类型（默认 product-shot） */
  type?: 'banner' | 'editorial' | 'product-shot';
  /** 成功回调：正式 URL 与缩略图 URL */
  onUploaded: (url: string, thumbUrl: string) => void;
  /** 按钮文案 */
  label?: string;
}

export function ImageUploadButton({
  type = 'product-shot',
  onUploaded,
  label = '上传图片',
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 处理选中文件：大小校验 → 上传 → 回调 URL（失败显示错误行） */
  const handleFile = useCallback(async (file: File) => {
    const MAX = 15 * 1024 * 1024;
    if (file.size > MAX) {
      setError('文件不能超过 15MB。');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const result = await uploadImage(file, type);
      onUploaded(result.url, result.thumb_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败，请重试。');
    } finally {
      setUploading(false);
    }
  }, [type, onUploaded]);

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // 清空选中值，允许再次选择同一文件
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-md bg-primary px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? '上传中…' : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
