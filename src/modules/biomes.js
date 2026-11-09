import { lerp } from '../core/utils.js';

// Fixed height bands, independent of the water level: the water plane
// (see createWaterPlane) moves on its own, so terrain never needs to be
// recolored/rebuilt just because the water level slider changed.
const SAND_END = 0.12;
const GRASS_END = 0.55;
const ROCK_END = 0.8;

export function biomeColor(height) {
  if (height < SAND_END) {
    return { r: 0.82, g: 0.74, b: 0.52 }; // sand / beach
  }

  if (height < GRASS_END) {
    const t = (height - SAND_END) / (GRASS_END - SAND_END);
    return {
      r: lerp(0.25, 0.15, t),
      g: lerp(0.55, 0.45, t),
      b: lerp(0.2, 0.15, t)
    };
  }

  if (height < ROCK_END) {
    const t = (height - GRASS_END) / (ROCK_END - GRASS_END);
    return {
      r: lerp(0.45, 0.55, t),
      g: lerp(0.4, 0.5, t),
      b: lerp(0.38, 0.48, t)
    };
  }

  const t = Math.min(1, (height - ROCK_END) / (1 - ROCK_END));
  return {
    r: lerp(0.85, 1, t),
    g: lerp(0.85, 1, t),
    b: lerp(0.88, 1, t)
  };
}
