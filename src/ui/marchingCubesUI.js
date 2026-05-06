import * as THREE from 'https://esm.sh/three@0.160';
import { buildMarchingCubes } from '../modules/mcubes/marchingcubes.js';

class Field3D {
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

// 🔥 TRUE scalar field (no floor / no ceiling)
function buildFieldFrom2D(inputField, size, heightScale) {
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

export function createMarchingCubesModule(container) {

  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>Marching Cubes</span>
    </div>

    <div class="module-body">
      <div class="controls">

        <label>Iso Level <span id="isoVal">0.0</span></label>
        <input type="range" id="iso" min="-2" max="2" step="0.05" value="0">

        <label>Height <span id="hVal">1.0</span></label>
        <input type="range" id="height" min="0.2" max="2" step="0.1" value="1">

        <div style="margin-top:10px;">
          <button id="rebuild">Rebuild</button>
        </div>

        <div style="margin-top:10px;">
          <button id="zoomIn">+</button>
          <button id="zoomOut">-</button>
        </div>

      </div>

      <div class="output">
        <canvas></canvas>
      </div>
    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');
  const rebuildBtn = module.querySelector('#rebuild');
  const zoomInBtn = module.querySelector('#zoomIn');
  const zoomOutBtn = module.querySelector('#zoomOut');

  const isoSlider = module.querySelector('#iso');
  const heightSlider = module.querySelector('#height');

  const isoVal = module.querySelector('#isoVal');
  const hVal = module.querySelector('#hVal');

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(500, 500);
  renderer.setClearColor(0x111111);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
  camera.position.set(2.5, 2.5, 2.5);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(3, 4, 3);
  scene.add(light);

  const group = new THREE.Group();
  scene.add(group);

  const size = 32;
  const cubeSize = 4;

  let mesh = null;
  let getInput = null;

  function rebuild() {
    if (!getInput) return;

    const input = getInput();
    if (!input || !input.data) {
      console.warn('MC: input not ready');
      return;
    }

    const iso = parseFloat(isoSlider.value);
    const heightScale = parseFloat(heightSlider.value);

    isoVal.textContent = iso.toFixed(2);
    hVal.textContent = heightScale.toFixed(2);

    if (mesh) {
      group.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = null;
    }

    const field3D = buildFieldFrom2D(input, size, heightScale);

    const geo = buildMarchingCubes(field3D, size, iso, cubeSize);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      flatShading: true,
      side: THREE.DoubleSide
    });

    mesh = new THREE.Mesh(geo, mat);

    // scale + flip
    mesh.scale.set(0.7, -0.7, 0.7);

    // fix lighting after flip
    mesh.geometry.computeVertexNormals();

    group.add(mesh);
  }

  rebuildBtn.addEventListener('click', rebuild);

  // sliders update labels only (no auto rebuild)
  isoSlider.addEventListener('input', () => {
    isoVal.textContent = parseFloat(isoSlider.value).toFixed(2);
  });

  heightSlider.addEventListener('input', () => {
    hVal.textContent = parseFloat(heightSlider.value).toFixed(2);
  });

  zoomInBtn.addEventListener('click', () => {
    camera.position.multiplyScalar(0.8);
  });

  zoomOutBtn.addEventListener('click', () => {
    camera.position.multiplyScalar(1.2);
  });

  function animate() {
    requestAnimationFrame(animate);

    group.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  animate();

return {

  setInput(fn) {
    getInput = fn;
    rebuild();
  },

  rebuild,

  getMesh() {
    return mesh;
  }
};
}