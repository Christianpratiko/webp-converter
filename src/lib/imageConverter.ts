interface ConvertOptions {
  quality: number; // 0 to 1
  maxWidth?: number;
  maxHeight?: number;
}

export const convertToWebP = async (
  file: File,
  options: ConvertOptions = { quality: 0.8 }
): Promise<{ blob: Blob; url: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions if max dimensions are provided
      if (options.maxWidth && width > options.maxWidth) {
        height = Math.round((height * options.maxWidth) / width);
        width = options.maxWidth;
      }
      if (options.maxHeight && height > options.maxHeight) {
        width = Math.round((width * options.maxHeight) / height);
        height = options.maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Fill background for transparent images
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'));
            return;
          }
          const webpUrl = URL.createObjectURL(blob);
          resolve({ blob, url: webpUrl, width, height });
        },
        'image/webp',
        options.quality
      );
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = objectUrl;
  });
};
