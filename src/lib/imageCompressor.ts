export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
}

/**
 * Compresses an image File using HTML5 Canvas to safely stay below Firestore 1MB limits.
 * Reduces 5MB-10MB camera photos down to 30KB-80KB with crisp quality.
 */
export async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<CompressionResult> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.72 } = options;
  const originalSizeBytes = file.size;

  // Non-image files (e.g. PDF) fallback to direct FileReader
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          dataUrl,
          originalSizeBytes,
          compressedSizeBytes: dataUrl.length,
          reductionPercentage: 0
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while bounding within maxWidth/maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawUrl = readerEvent.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            originalSizeBytes,
            compressedSizeBytes: rawUrl.length,
            reductionPercentage: 0
          });
          return;
        }

        // Apply smooth bilinear scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
        );

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeBytes,
          compressedSizeBytes,
          reductionPercentage
        });
      };
      img.onerror = (err) => reject(err);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
