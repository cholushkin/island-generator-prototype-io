import * as THREE from 'https://esm.sh/three@0.160';
import { createEmitter } from '../core/reactive.js';
import { createViewport3d, bindZoomButtons } from './helpers/viewport3d.js';

// island footprint half-extent in world space after the terrain's 20x scale
const ISLAND_HALF = 10;

export function createFinalModule(container, configNode) {

  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>7. Final</span>
    </div>

    <div class="module-body">

      <div class="controls">

        <label>Offset X</label>
        <input type="range" id="ox" min="-5" max="5" step="0.01" value="0">

        <label>Offset Z</label>
        <input type="range" id="oz" min="-5" max="5" step="0.01" value="0">

        <label>Scale XZ</label>
        <input type="range" id="sxz" min="0.1" max="5" step="0.01" value="0.5">

        <label>Scale Y</label>
        <input type="range" id="sy" min="0.1" max="5" step="0.01" value="0.5">

        <div style="margin-top:10px;">
          <button class="zoomIn">+</button>
          <button class="zoomOut">-</button>
        </div>

      </div>

      <div class="output">
        <canvas></canvas>

        <div class="second-viewport">
          <div class="eye-row">
            <button id="eyeBtn">👁</button>
            <span id="viewLabel">Corner NE</span>
          </div>
          <canvas id="secondCanvas"></canvas>
        </div>
      </div>

    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');
  const secondCanvas = module.querySelector('#secondCanvas');
  const eyeBtn = module.querySelector('#eyeBtn');
  const viewLabel = module.querySelector('#viewLabel');

  const config = configNode.getConfig();

  // -------------------------
  // main (orbiting) viewport
  // -------------------------
  const viewport = createViewport3d(canvas, {
    size: config.viewportSize,
    background: config.background,
    cameraDistance: 18,
    far: 1000,
    ambient: 0.8
  });

  viewport.camera.position.set(18, 14, 18);
  viewport.camera.lookAt(0, 0, 0);

  viewport.setAutoRotate(config.autoRotate);
  viewport.setRotationSpeed(config.rotationSpeed);

  bindZoomButtons(module, viewport);

  const scene = viewport.scene;

  // -------------------------
  // second viewport: 4 corners + top-down, cycled by the eye button
  // -------------------------
  const secondRenderer = new THREE.WebGLRenderer({ canvas: secondCanvas, antialias: true });
  secondRenderer.setSize(config.viewportSize, config.viewportSize);
  secondRenderer.setClearColor(config.background);

  function makeCornerCamera(x, z) {
    const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    cam.position.set(x, ISLAND_HALF + 8, z);
    cam.lookAt(0, 0, 0);
    return cam;
  }

  const topCam = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
  topCam.position.set(0, ISLAND_HALF + 20, 0);
  topCam.up.set(0, 0, -1); // avoid the lookAt gimbal case when staring straight down
  topCam.lookAt(0, 0, 0);

  const corner = ISLAND_HALF + 4;

  const views = [
    { cam: makeCornerCamera(corner, corner), label: 'Corner NE' },
    { cam: makeCornerCamera(-corner, corner), label: 'Corner NW' },
    { cam: makeCornerCamera(-corner, -corner), label: 'Corner SW' },
    { cam: makeCornerCamera(corner, -corner), label: 'Corner SE' },
    { cam: topCam, label: 'Top' }
  ];

  let viewIndex = 0;

  eyeBtn.addEventListener('click', () => {
    viewIndex = (viewIndex + 1) % views.length;
    viewLabel.textContent = views[viewIndex].label;
  });

  // -------------------------
  // controls
  // -------------------------
  const ox = module.querySelector('#ox');
  const oz = module.querySelector('#oz');
  const sxz = module.querySelector('#sxz');
  const sy = module.querySelector('#sy');

  // node providers (reactive)
  let terrainNode = null;
  let marchingNode = null;

  let world = null;

  const emitter = createEmitter();

  [ox, oz, sxz, sy].forEach(el => {
    el.addEventListener('input', rebuild);
  });

  function rebuild() {

    if (!terrainNode || !marchingNode) return;

    const terrainSource = terrainNode.getMesh();
    const castleSource = marchingNode.getMesh();

    if (!terrainSource || !castleSource) return;

    if (world) {
      scene.remove(world);
    }

    world = new THREE.Group();

    // -------------------------
    // TERRAIN (+ water plane, cloned together so water rises reactively)
    // -------------------------
    const terrain = terrainSource.clone(true);
    terrain.scale.set(20, 20, 20);
    terrain.position.set(0, 0, 0);

    world.add(terrain);
    world.updateMatrixWorld(true);

    const terrainMesh = terrain.getObjectByName('terrain');

    // -------------------------
    // MARCHING CUBES CASTLE
    // -------------------------
    const castle = castleSource.clone();

    castle.rotation.set(0, 0, 0);

    const scaleXZ = parseFloat(sxz.value);
    const scaleY = parseFloat(sy.value);

    // negative Y flips the marching-cubes mesh upright
    castle.scale.set(
      scaleXZ * 2,
      -scaleY * 2,
      scaleXZ * 2
    );

    castle.position.set(
      parseFloat(ox.value),
      0,
      parseFloat(oz.value)
    );

    castle.updateMatrixWorld(true);

    // raycast straight down onto the terrain so the castle's bbox
    // center-bottom touches the ground, wherever it is placed
    if (terrainMesh) {
      const bbox = new THREE.Box3().setFromObject(castle);
      const center = bbox.getCenter(new THREE.Vector3());

      const raycaster = new THREE.Raycaster(
        new THREE.Vector3(center.x, ISLAND_HALF * 4, center.z),
        new THREE.Vector3(0, -1, 0)
      );
      raycaster.far = ISLAND_HALF * 8;

      const hits = raycaster.intersectObject(terrainMesh, true);

      if (hits.length > 0) {
        const groundY = hits[0].point.y;
        castle.position.y += (groundY - bbox.min.y);
        castle.updateMatrixWorld(true);
      }
    }

    // material
    if (castle.material) {
      castle.material = castle.material.clone();
      castle.material.color.setRGB(0.9, 1.0, 0.9);
    }

    if (castle.geometry) {
      castle.geometry.computeVertexNormals();
    }

    world.add(castle);

    scene.add(world);

    emitter.emit();
  }

  configNode.subscribe(() => {
    const c = configNode.getConfig();
    viewport.setSize(c.viewportSize);
    viewport.setBackground(c.background);
    viewport.setAutoRotate(c.autoRotate);
    viewport.setRotationSpeed(c.rotationSpeed);

    secondRenderer.setSize(c.viewportSize, c.viewportSize);
    secondRenderer.setClearColor(c.background);
  });

  viewport.startLoop(() => {
    secondRenderer.render(scene, views[viewIndex].cam);
  });

  // public API
  return {
    el: module,

    setTerrain(node) {
      terrainNode = node;
      node.subscribe(rebuild);
      rebuild();
    },

    setMarching(node) {
      marchingNode = node;
      node.subscribe(rebuild);
      rebuild();
    },

    getOutput() {
      return world;
    },

    subscribe: emitter.subscribe
  };
}
