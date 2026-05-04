
import { Field } from '../../../core/field.js';
import { rand } from '../../../core/utils.js';

function extractTiles(pattern, tileSize) {
  const tiles = [];
  const map = new Map();

  for (let y = 0; y <= pattern.height - tileSize; y++) {
    for (let x = 0; x <= pattern.width - tileSize; x++) {

      let key = "";

      for (let dy = 0; dy < tileSize; dy++) {
        for (let dx = 0; dx < tileSize; dx++) {
          key += pattern.data[
            (y + dy) * pattern.width + (x + dx)
          ].toFixed(2) + ",";
        }
      }

      if (!map.has(key)) {
        map.set(key, tiles.length);
        tiles.push({ x, y });
      }
    }
  }

  return tiles;
}

function compatible(pattern, t1, t2, tileSize, dir) {
  for (let i = 0; i < tileSize; i++) {
    let a, b;

    if (dir === "right") {
      a = pattern.data[(t1.y + i) * pattern.width + (t1.x + tileSize - 1)];
      b = pattern.data[(t2.y + i) * pattern.width + t2.x];
    }

    if (dir === "down") {
      a = pattern.data[(t1.y + tileSize - 1) * pattern.width + (t1.x + i)];
      b = pattern.data[t2.y * pattern.width + (t2.x + i)];
    }

    if (Math.abs(a - b) > 0.25) return false;
  }

  return true;
}

export function synthWFC(pattern, width, height, tileSize, seed) {

  // 🔒 clamp tile size (NO recursion)
  tileSize = Math.min(
    tileSize,
    Math.max(2, Math.floor(Math.min(pattern.width, pattern.height) / 2))
  );

  const tiles = extractTiles(pattern, tileSize);
  if (tiles.length === 0) {
    // fallback: just return noise instead of freezing
    const out = new Float32Array(width * height);
    for (let i = 0; i < out.length; i++) {
      out[i] = rand(i, seed, seed);
    }
    return new Field(width, height, out);
  }

  const gridW = Math.floor(width / tileSize);
  const gridH = Math.floor(height / tileSize);

  const wave = Array(gridW * gridH).fill(0).map(() =>
    new Set(tiles.map((_, i) => i))
  );

  function index(x, y) {
    return y * gridW + x;
  }

  function collapse(x, y) {
    const options = Array.from(wave[index(x, y)]);
    if (options.length === 0) return;

    const choice = options[Math.floor(rand(x, y, seed) * options.length)];
    wave[index(x, y)] = new Set([choice]);
  }

  function propagate() {
    let iterations = 0;
    let changed = true;

    while (changed && iterations < 50) { // 🔒 HARD LIMIT
      changed = false;
      iterations++;

      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {

          const cell = wave[index(x, y)];

          if (cell.size === 1) {
            const tileIndex = [...cell][0];
            const tile = tiles[tileIndex];

            if (!tile) continue;

            // RIGHT
            if (x + 1 < gridW) {
              const neighbor = wave[index(x + 1, y)];

              for (let t of Array.from(neighbor)) {
                if (!compatible(pattern, tile, tiles[t], tileSize, "right")) {
                  neighbor.delete(t);
                  changed = true;
                }
              }
            }

            // DOWN
            if (y + 1 < gridH) {
              const neighbor = wave[index(x, y + 1)];

              for (let t of Array.from(neighbor)) {
                if (!compatible(pattern, tile, tiles[t], tileSize, "down")) {
                  neighbor.delete(t);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  // 🔁 main loop (bounded)
  for (let i = 0; i < gridW * gridH; i++) {

    let min = Infinity;
    let target = -1;

    for (let j = 0; j < wave.length; j++) {
      const size = wave[j].size;
      if (size > 1 && size < min) {
        min = size;
        target = j;
      }
    }

    if (target === -1) break;

    const x = target % gridW;
    const y = Math.floor(target / gridW);

    collapse(x, y);
    propagate();
  }

  // build output
  const out = new Float32Array(width * height);

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {

      const cell = wave[index(gx, gy)];
      const tileIndex = cell.size ? [...cell][0] : 0;
      const tile = tiles[tileIndex];

      if (!tile) continue;

      for (let dy = 0; dy < tileSize; dy++) {
        for (let dx = 0; dx < tileSize; dx++) {

          const sx = tile.x + dx;
          const sy = tile.y + dy;

          const tx = gx * tileSize + dx;
          const ty = gy * tileSize + dy;

          if (tx >= width || ty >= height) continue;

          out[ty * width + tx] =
            pattern.data[sy * pattern.width + sx];
        }
      }
    }
  }

  return new Field(width, height, out);
}

