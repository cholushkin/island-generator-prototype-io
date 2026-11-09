import * as THREE from 'https://esm.sh/three@0.160';
import { biomeColor } from './biomes.js';

export function createTerrainMesh(field, options = {}) {
  const {
    heightScale = 0.3
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

    pos.setY(i, h * heightScale);

    const { r, g, b } = biomeColor(h);
    colors.push(r, g, b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'terrain';
  return mesh;
}

// A flat plane representing the water surface. It shares the terrain's
// footprint (unit plane) and is positioned/scaled by the caller so moving
// the water level only requires repositioning this mesh, no regeneration.
export function createWaterPlane() {
  const geo = new THREE.PlaneGeometry(1.4, 1.4);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x3a7bd5,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'water';
  return mesh;
}
