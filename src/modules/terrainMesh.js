import * as THREE from 'https://esm.sh/three@0.160';

export function createTerrainMesh(field, options = {}) {
  const {
    heightScale = 0.3,
    waterLevel = 0.05
  } = options;

  const width = field.width;
  const height = field.height;

  const geo = new THREE.PlaneGeometry(1, 1, width - 1, height - 1);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = [];

  for (let i = 0; i < pos.count; i++) {
    const x = i % width;
    const y = Math.floor(i / width);

    const h = field.data[y * width + x];

    // height
    pos.setY(i, h * heightScale);

    let r, g, b;

    if (h < waterLevel) {
      // water (blue)
      r = 0.1;
      g = 0.3;
      b = 0.8;
    } else {
      // gray → white
      const t = (h - waterLevel) / (1 - waterLevel);
      r = g = b = t;
    }

    colors.push(r, g, b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true
  });

  return new THREE.Mesh(geo, mat);
}