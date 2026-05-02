import { Field } from '../core/field.js';
import { lerp, rand } from '../core/utils.js';

function smoothNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = x - x0;
  const sy = y - y0;

  const n0 = rand(x0, y0, seed);
  const n1 = rand(x1, y0, seed);
  const ix0 = lerp(n0, n1, sx);

  const n2 = rand(x0, y1, seed);
  const n3 = rand(x1, y1, seed);
  const ix1 = lerp(n2, n3, sx);

  return lerp(ix0, ix1, sy);
}

function fbm(x, y, params) {
  let value = 0;
  let amp = 1;
  let freq = params.scale;

  for (let i = 0; i < params.octaves; i++) {
    value += smoothNoise(x * freq, y * freq, params.seed) * amp;
    amp *= params.persistence;
    freq *= 2;
  }

  return value;
}

export function generateNoise(params, width = 256, height = 256) {
  const data = new Float32Array(width * height);

  let min = Infinity;
  let max = -Infinity;

  // generate raw noise
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = fbm(x, y, params);
      data[y * width + x] = v;

      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  // normalize to 0..1
  const range = max - min || 1;

  for (let i = 0; i < data.length; i++) {
    data[i] = (data[i] - min) / range;
  }

  return new Field(width, height, data);
}