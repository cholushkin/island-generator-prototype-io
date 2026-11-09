import * as THREE from 'https://esm.sh/three@0.160';
import { buildMarchingCubes } from '../modules/mcubes/marchingcubes.js';
import { buildFieldFrom2D } from '../modules/mcubes/fieldBuilder.js';
import { createEmitter } from '../core/reactive.js';
import { createViewport3d, bindZoomButtons } from './helpers/viewport3d.js';
import { syncLabel } from './helpers/controls.js';

export function createMarchingCubesModule(container, configNode) {

  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>6. Marching Cubes</span>
    </div>

    <div class="module-body">
      <div class="controls">

        <label>Iso Level <span id="isoVal">0.0</span></label>
        <input type="range" id="iso" min="-2" max="2" step="0.05" value="0">

        <label>Height <span id="hVal">1.0</span></label>
        <input type="range" id="height" min="0.2" max="2" step="0.1" value="1">

        <div style="margin-top:10px;">
          <button class="zoomIn">+</button>
          <button class="zoomOut">-</button>
        </div>

      </div>

      <div class="output">
        <canvas></canvas>
      </div>
    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');
  const config = configNode.getConfig();

  const isoSlider = module.querySelector('#iso');
  const heightSlider = module.querySelector('#height');

  const isoVal = module.querySelector('#isoVal');
  const hVal = module.querySelector('#hVal');

  const viewport = createViewport3d(canvas, {
    size: config.viewportSize,
    background: config.background,
    cameraDistance: 2.5
  });

  viewport.setAutoRotate(config.autoRotate);
  viewport.setRotationSpeed(config.rotationSpeed);

  bindZoomButtons(module, viewport);

  const group = new THREE.Group();
  viewport.scene.add(group);
  viewport.setRotationTarget(group);

  const size = 32;
  const cubeSize = 4;

  let mesh = null;
  let inputNode = null;

  const emitter = createEmitter();

  function rebuild() {
    if (!inputNode) return;

    const input = inputNode.getOutput();
    if (!input || !input.data) return;

    const iso = syncLabel(isoSlider, isoVal, v => v.toFixed(2));
    const heightScale = syncLabel(heightSlider, hVal, v => v.toFixed(2));

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

    emitter.emit();
  }

  // every control change rebuilds immediately - no manual rebuild button
  isoSlider.addEventListener('input', rebuild);
  heightSlider.addEventListener('input', rebuild);

  configNode.subscribe(() => {
    const c = configNode.getConfig();
    viewport.setSize(c.viewportSize);
    viewport.setBackground(c.background);
    viewport.setAutoRotate(c.autoRotate);
    viewport.setRotationSpeed(c.rotationSpeed);
  });

  viewport.startLoop();

  return {
    el: module,

    setInput(node) {
      inputNode = node;
      node.subscribe(rebuild);
      rebuild();
    },

    getMesh() {
      return mesh;
    },

    subscribe: emitter.subscribe
  };
}
