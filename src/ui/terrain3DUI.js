import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { createTerrainMesh } from '../modules/terrainMesh.js';

export function createTerrain3DModule(container) {
  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>3. 3D View</span>
      <span>Output: mesh</span>
    </div>

    <div class="module-body">
      <div class="controls">
        <label>Height <span id="hVal">0.3</span></label>
        <input type="range" id="height" min="0.05" max="1" step="0.05" value="0.3">

        <label>Water Level <span id="wVal">0.05</span></label>
        <input type="range" id="water" min="0" max="0.3" step="0.01" value="0.05">

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

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(500, 500);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
  camera.position.set(1.2, 1, 1.2);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 2, 1);
  scene.add(light);

  let mesh = null;
  let getInput = null;

  const heightSlider = module.querySelector('#height');
  const waterSlider = module.querySelector('#water');

  const hVal = module.querySelector('#hVal');
  const wVal = module.querySelector('#wVal');

  const zoomIn = module.querySelector('#zoomIn');
  const zoomOut = module.querySelector('#zoomOut');

  function update() {
    if (!getInput) return;

    const field = getInput();
    if (!field) return;

    const heightScale = parseFloat(heightSlider.value);
    const waterLevel = parseFloat(waterSlider.value);

    hVal.textContent = heightScale.toFixed(2);
    wVal.textContent = waterLevel.toFixed(2);

    if (mesh) scene.remove(mesh);

    mesh = createTerrainMesh(field, {
      heightScale,
      waterLevel
    });

    scene.add(mesh);
  }

  heightSlider.addEventListener('input', update);
  waterSlider.addEventListener('input', update);

  // ✅ zoom controls
  zoomIn.addEventListener('click', () => {
    camera.position.multiplyScalar(0.8);
  });

  zoomOut.addEventListener('click', () => {
    camera.position.multiplyScalar(1.2);
  });

  function animate() {
    requestAnimationFrame(animate);

    if (mesh) mesh.rotation.y += 0.003;

    renderer.render(scene, camera);
  }

  animate();

  return {
    setInput(fn) {
      getInput = fn;
      update();
    }
  };
}