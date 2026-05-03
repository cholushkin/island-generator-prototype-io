import { synthPatch } from './algorithms/patch.js';

export function generateSynTex(params, pattern) {
  const {
    width = 256,
    height = 256,
    patchSize = 16,
    seed = 1234
  } = params;

  return synthPatch(pattern, width, height, patchSize, seed);
}