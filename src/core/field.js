export class Field {
  constructor(width, height, data) {
    this.width = width;
    this.height = height;
    this.data = data; // Float32Array
  }

  get(x, y) {
    return this.data[y * this.width + x];
  }

  set(x, y, value) {
    this.data[y * this.width + x] = value;
  }
}