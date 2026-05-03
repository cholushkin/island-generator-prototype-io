import * as THREE from 'https://esm.sh/three@0.160';
import { buildMarchingCubes } from '../modules/mcubes/marchingcubes.js';

class Field3D {
  constructor(w, h, d, data) {
    this.w = w;
    this.h = h;
    this.d = d;
    this.data = data;
  }

  index(x, y, z) {
    return x + y * this.w + z * this.w * this.h;
  }

  get(x, y, z) {
    return this.data[this.index(x, y, z)];
  }

  set(x, y, z, v) {
    this.data[this.index(x, y, z)] = v;
  }
}

function generateBlobs(size = 16) {
  const data = new Float32Array(size * size * size);
  const field = new Field3D(size, size, size, data);

  const blobCount = 2 + Math.floor(Math.random() * 4); // 2–5

  const blobs = [];

  for (let i = 0; i < blobCount; i++) {
    blobs.push([
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
      4 + Math.random() * 6
    ]);
  }

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {

        let v = 0;

        for (let b of blobs) {
          const dx = x - b[0];
          const dy = y - b[1];
          const dz = z - b[2];

          const dist = dx * dx + dy * dy + dz * dz;

          if (dist < b[3]) {
            v = 1;
            break;
          }
        }

        field.set(x, y, z, v);
      }
    }
  }

  return field;
}

export function createMarchingCubesModule(container) {

  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>Marching Cubes (custom)</span>
      <button id="regen">regen</button>
    </div>
    <div class="module-body">
      <canvas></canvas>
    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');
  const button = module.querySelector('#regen');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    depth: true
  });

  renderer.setSize(500, 500);
  renderer.setClearColor(0x222222);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const group = new THREE.Group();
  scene.add(group);

  const resolution = 16;
  const cubeSize = 4;

  let mesh = null;

  function rebuild() {
    if (mesh) {
      group.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = null;
    }

    const field = generateBlobs(resolution);
    const geo = buildMarchingCubes(field, resolution, 0.5, cubeSize);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      flatShading: true,
      side: THREE.DoubleSide
    });

    mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }

  rebuild();

  // cube edges
  const edges = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
  );

  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );

  group.add(line);

  // cube faces (transparent colored planes)
  const faceGeo = new THREE.PlaneGeometry(cubeSize, cubeSize);

  const faces = [
    { color: 0xff0000, pos: [ cubeSize/2, 0, 0 ], rot: [0, -Math.PI/2, 0] },
    { color: 0x880000, pos: [-cubeSize/2, 0, 0 ], rot: [0,  Math.PI/2, 0] },

    { color: 0x00ff00, pos: [0,  cubeSize/2, 0 ], rot: [ Math.PI/2, 0, 0] },
    { color: 0x008800, pos: [0, -cubeSize/2, 0 ], rot: [-Math.PI/2, 0, 0] },

    { color: 0x0000ff, pos: [0, 0,  cubeSize/2], rot: [0, 0, 0] },
    { color: 0x000088, pos: [0, 0, -cubeSize/2], rot: [0, Math.PI, 0] }
  ];

  faces.forEach(f => {
    const mat = new THREE.MeshBasicMaterial({
      color: f.color,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const m = new THREE.Mesh(faceGeo, mat);
    m.position.set(...f.pos);
    m.rotation.set(...f.rot);

    group.add(m);
  });

  button.addEventListener('click', rebuild);

  function animate() {
    requestAnimationFrame(animate);

    group.rotation.y += 0.01;
    group.rotation.x += 0.005;

    renderer.render(scene, camera);
  }

  animate();

  return {
    setInput() {}
  };
}