import { Field } from '../../core/field.js';

export function loadPatternImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      const data = new Float32Array(img.width * img.height);

      for (let i = 0; i < data.length; i++) {
        const r = pixels[i * 4];
        const g = pixels[i * 4 + 1];
        const b = pixels[i * 4 + 2];

        data[i] = (r + g + b) / (3 * 255);
      }

      resolve(new Field(img.width, img.height, data));
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
  });
}