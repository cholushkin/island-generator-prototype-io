import { synthWFC } from './algorithms/WFC.js';

/* -----------------------------
   Internal mask (white edges)
----------------------------- */
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function applyInternalMask(field, radius = 0.4, softness = 0.1) {
  const { width, height, data } = field;

  const out = new Float32Array(width * height);

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
      const base = data[i];

      const edge = 1.0 - smoothstep(
        maxDist - softWidth,
        maxDist,
        dist
      );

      // fade to WHITE
      out[i] = base * edge + (1 - edge);
    }
  }

  return {
    width,
    height,
    data: out
  };
}

/* -----------------------------
   Main generator (WFC only)
----------------------------- */
export function generateSynTex(params, pattern) {
  const {
    width = 256,
    height = 256,
    patchSize = 16,
    seed = 1234,

    // mask params
    mask = false,
    maskRadius = 0.4,
    maskSoftness = 0.1
  } = params;

  // WFC synthesis
  let result = synthWFC(pattern, width, height, patchSize, seed);

  // optional mask
  if (mask) {
    result = applyInternalMask(
      result,
      maskRadius,
      maskSoftness
    );
  }

  return result;
}