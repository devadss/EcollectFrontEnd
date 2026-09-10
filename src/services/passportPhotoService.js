/**
 * ==========================================================================
 * FINWIN eCollect - Enterprise Client-Side Passport Photo Service
 * Resizes & compresses any user/agent photo into standard KYC Passport size
 * (3.5 x 4.5 aspect ratio, ~240x300 px, ~15-20 KB compressed JPEG).
 * Prevents raw multi-megabyte byte arrays from overloading DB / LocalStorage.
 * ==========================================================================
 */

/**
 * Compresses an image File or Blob to standard KYC Passport size.
 * @param {File|Blob} file - The raw uploaded image file from device/camera.
 * @param {number} maxWidth - Standard passport width in pixels (default: 240px).
 * @param {number} maxHeight - Standard passport height in pixels (default: 300px, 3.5:4.5 ratio).
 * @param {number} quality - JPEG compression quality (default: 0.82).
 * @returns {Promise<string>} - Clean, lightweight base64 DataURL (~15-20KB).
 */
export const compressToPassportPhoto = (file, maxWidth = 240, maxHeight = 300, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    // Validate that input is an image
    if (file.type && !file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file from storage'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image data onto canvas'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = maxHeight;
          const ctx = canvas.getContext('2d');

          // Fill clean crisp white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, maxWidth, maxHeight);

          // Center-crop to passport 3.5:4.5 aspect ratio
          const targetRatio = maxWidth / maxHeight;
          const imgRatio = img.width / img.height;

          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (imgRatio > targetRatio) {
            // Source is wider -> crop horizontally
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else {
            // Source is taller -> crop vertically
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }

          // Draw cropped & scaled image
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, maxWidth, maxHeight);

          // Export lightweight JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Storage helpers for local session caching
 */
export const getStoredCustomerPhotos = () => {
  try {
    return JSON.parse(localStorage.getItem('ecollect_customer_photos') || '{}');
  } catch {
    return {};
  }
};

export const saveStoredCustomerPhoto = (accNo, photoUrl) => {
  if (!accNo) return;
  try {
    const photos = getStoredCustomerPhotos();
    if (photoUrl) {
      photos[String(accNo).trim()] = photoUrl;
    } else {
      delete photos[String(accNo).trim()];
    }
    localStorage.setItem('ecollect_customer_photos', JSON.stringify(photos));
  } catch (e) {
    console.warn('Photo cache quota notice:', e);
  }
};
