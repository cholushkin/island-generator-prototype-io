import { Field } from '../../../core/field.js';
import { rand } from '../../../core/utils.js';

export function synthPatch(pattern, width, height, patchSize, seed) {
  const out = new Float32Array(width * height);

  const pw = pattern.width;
  const ph = pattern.height;

  for (let y = 0; y < height; y += patchSize) {
    for (let x = 0; x < width; x += patchSize) {

      const px = Math.floor(rand(x, y, seed) * (pw - patchSize));
      const py = Math.floor(rand(y, x, seed) * (ph - patchSize));

      for (let dy = 0; dy < patchSize; dy++) {
        for (let dx = 0; dx < patchSize; dx++) {

          const sx = px + dx;
          const sy = py + dy;

          const tx = x + dx;
          const ty = y + dy;

          if (tx >= width || ty >= height) continue;

          out[ty * width + tx] = pattern.data[sy * pw + sx];
        }
      }
    }
  }

  return new Field(width, height, out);
}