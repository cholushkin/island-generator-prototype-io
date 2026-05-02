export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rand(x, y, seed) {
  let s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return s - Math.floor(s);
}