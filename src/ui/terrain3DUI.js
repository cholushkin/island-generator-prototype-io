import * as THREE from 'https://esm.sh/three@0.160';
import { createTerrainMesh, createWaterPlane } from '../modules/terrainMesh.js';
import { createEmitter } from '../core/reactive.js';
import { createViewport3d, bindZoomButtons } from './helpers/viewport3d.js';
import { syncLabel } from './helpers/controls.js';

export function createLandmassModule(container, configNode) {

  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>4. Landmass</span>
    </div>

    <div class="module-body">

      <div class="controls">

        <label>Height <span id="hVal">0.3</span></label>
        <input
          type="range"
          id="height"
          min="0.05"
          max="1"
          step="0.05"
          value="0.3"
        >

        <label>Water Level <span id="wVal">0.05</span></label>
        <input
          type="range"
          id="water"
          min="0"
          max="0.3"
          step="0.01"
          value="0.05"
        >

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

  const viewport = createViewport3d(canvas, {
    size: config.viewportSize,
    background: config.background,
    cameraDistance: 1.2,
    far: 10
  });

  viewport.setAutoRotate(config.autoRotate);
  viewport.setRotationSpeed(config.rotationSpeed);

  bindZoomButtons(module, viewport);

  // everything that rotates lives in this group
  const group = new THREE.Group();
  viewport.scene.add(group);
  viewport.setRotationTarget(group);

  const waterPlane = createWaterPlane();
  group.add(waterPlane);

  let terrainMesh = null;

  // ui controls
  const heightSlider = module.querySelector('#height');
  const waterSlider = module.querySelector('#water');

  const hVal = module.querySelector('#hVal');
  const wVal = module.querySelector('#wVal');

  const emitter = createEmitter();

  let inputNode = null;

  function currentHeightScale() {
    return parseFloat(heightSlider.value);
  }

  function currentWaterLevel() {
    return parseFloat(waterSlider.value);
  }

  // moving the water level only repositions the plane - no terrain rebuild
  function updateWaterPosition() {
    const waterLevel = syncLabel(waterSlider, wVal, v => v.toFixed(2));
    waterPlane.position.y = waterLevel * currentHeightScale();
  }

  function rebuildTerrain() {
    if (!inputNode) return;

    const field = inputNode.getOutput();
    if (!field) return;

    const heightScale = syncLabel(heightSlider, hVal, v => v.toFixed(2));

    if (terrainMesh) {
      group.remove(terrainMesh);
      terrainMesh.geometry.dispose();
      terrainMesh.material.dispose();
    }

    terrainMesh = createTerrainMesh(field, { heightScale });
    group.add(terrainMesh);

    updateWaterPosition();

    emitter.emit();
  }

  heightSlider.addEventListener('input', rebuildTerrain);

  waterSlider.addEventListener('input', () => {
    updateWaterPosition();
    emitter.emit();
  });

  configNode.subscribe(() => {
    const c = configNode.getConfig();
    viewport.setSize(c.viewportSize);
    viewport.setBackground(c.background);
    viewport.setAutoRotate(c.autoRotate);
    viewport.setRotationSpeed(c.rotationSpeed);
  });

  viewport.startLoop();

  // public API
  return {
    el: module,

    // receives upstream field node
    setInput(node) {
      inputNode = node;
      node.subscribe(rebuildTerrain);
      rebuildTerrain();
    },

    // group containing terrain + water plane (what Final clones)
    getMesh() {
      return group;
    },

    getWaterLevel: currentWaterLevel,
    getHeightScale: currentHeightScale,

    subscribe: emitter.subscribe
  };
}
