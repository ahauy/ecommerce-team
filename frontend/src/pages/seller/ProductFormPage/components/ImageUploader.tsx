import React, { useState, useRef } from 'react';
import { UploadCloud, X, Plus, AlertCircle, Info, Loader2 } from 'lucide-react';
import { uploadService } from '../services/upload.service';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

const MAX_IMAGES = 5;

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    setErrorMessage(null);

    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Bạn đã tải lên tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    setIsUploading(true);

    const newUrls: string[] = [];
    try {
      for (const file of filesToUpload) {
        const url = await uploadService.uploadImage(file);
        newUrls.push(url);
      }
      onChange([...images, ...newUrls]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải ảnh lên thất bại';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const next = images.filter((_, i) => i !== index);
    onChange(next);
    setErrorMessage(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      data-testid="image-uploader"
      className="flex flex-col gap-4 bg-white rounded-xl p-5 sm:p-6 border border-hairline-light shadow-card"
    >
      {/* Header & Counter */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-black">
            Hình ảnh sản phẩm
          </h2>
          <span
            data-testid="photo-counter"
            className="text-[11px] font-medium text-zinc-600 px-2.5 py-0.5 bg-canvas-cream border border-hairline-light rounded-full"
          >
            {images.length}/{MAX_IMAGES} ảnh
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          Tối đa 5 ảnh · JPG, PNG, WEBP · mỗi ảnh tối đa 5MB
        </p>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div
          data-testid="uploader-error-message"
          className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dropzone */}
      {images.length < MAX_IMAGES && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-hairline-light bg-canvas-cream hover:bg-zinc-50 transition-all cursor-pointer text-center ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white border border-hairline-light flex items-center justify-center text-black shadow-xs mb-2 group-hover:scale-105 transition-transform">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <UploadCloud className="w-5 h-5 text-black" />
            )}
          </div>
          <p className="text-xs font-medium text-black">
            {isUploading
              ? 'Đang tải ảnh lên Cloudinary...'
              : 'Kéo thả ảnh vào đây hoặc chọn từ máy'}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={disabled || isUploading}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Images Grid (3 cols on small, 5 slots total) */}
      <div className="grid grid-cols-3 gap-2.5">
        {images.map((url, idx) => (
          <div
            key={url + idx}
            data-testid={`image-slot-${idx}`}
            className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-hairline-light shadow-xs"
          >
            <img
              src={url}
              alt={`Ảnh sản phẩm ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-aloe text-black text-[10px] font-semibold shadow-xs">
                Ảnh bìa
              </div>
            )}
            {!disabled && (
              <button
                type="button"
                aria-label={`Xóa ảnh ${idx + 1}`}
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* Empty placeholder slots up to 5 */}
        {Array.from({ length: Math.max(0, MAX_IMAGES - images.length) }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
              className={`aspect-square rounded-lg bg-canvas-cream border border-dashed border-hairline-light flex flex-col items-center justify-center text-zinc-400 transition-colors ${
                disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:text-black hover:border-zinc-400 cursor-pointer'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] text-zinc-500 mt-0.5">Thêm ảnh</span>
            </div>
          )
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs pt-1">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Ảnh đầu tiên sẽ là ảnh bìa hiển thị trên sàn.</span>
      </div>
    </div>
  );
};
