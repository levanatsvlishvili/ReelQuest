/**
 * Client-side Avatar Image Processing & S3 Upload Helper
 * Crops image to 1:1 square, resizes to 256x256, compresses, and generates DataURL / S3 upload payload.
 */

export async function processAvatarImage(file) {
  if (!file) throw new Error('No file selected');

  // Verify mime type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (PNG, JPG, WebP, GIF)');
  }

  // Max 8MB
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Image size exceeds 8MB. Please select a smaller photo.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        try {
          // Crop to centered square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          const targetSize = 256;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          // Export as compressed WebP or JPEG DataURL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({
            dataUrl,
            width: targetSize,
            height: targetSize,
            sizeBytes: Math.round(dataUrl.length * (3 / 4))
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
