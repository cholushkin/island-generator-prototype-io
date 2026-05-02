import { Field } from '../core/field.js';

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function applyMask(inputField, radius = 0.4, threshold = 0.0, softness = 0.1) {
  const { width, height } = inputField;
  const data = new Float32Array(width * height);

  const cx = width / 2;
  const cy = height / 2;

  const maxDist = Math.min(width, height) * radius;
  const softWidth = maxDist * softness;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const i = y * width + x;
      const base = inputField.data[i];

      // SDF-style falloff
      const edge = 1.0 - smoothstep(maxDist - softWidth, maxDist, dist);

      let v = base * edge;

      // threshold
      if (v < threshold) v = 0;

      data[i] = v;
    }
  }

  return new Field(width, height, data);
}