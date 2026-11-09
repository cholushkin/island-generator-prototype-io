export class Field3D {
  constructor(size) {
    this.size = size;
    this.data = new Float32Array(size * size * size);
  }

  index(x, y, z) {
    return x + y * this.size + z * this.size * this.size;
  }

  get(x, y, z) {
    return this.data[this.index(x, y, z)];
  }

  set(x, y, z, v) {
    this.data[this.index(x, y, z)] = v;
  }
}

// true scalar field (no floor / no ceiling) built from a 2D height field
export function buildFieldFrom2D(inputField, size, heightScale) {
  const field = new Field3D(size);

  const w = inputField.width;
  const h = inputField.height;

  function sample(ix, iz) {
    const x = Math.floor((ix / size) * w);
    const z = Math.floor((iz / size) * h);

    const xi = Math.max(0, Math.min(w - 1, x));
    const zi = Math.max(0, Math.min(h - 1, z));

    return inputField.data[zi * w + xi] || 0;
  }

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {

      const density = sample(x, z); // 0..1

      // scale height influence
      const maxY = density * (size * heightScale);

      for (let y = 0; y < size; y++) {

        // signed distance-like field
        const v = maxY - y;

        field.set(x, y, z, v);
      }
    }
  }

  return field;
}
