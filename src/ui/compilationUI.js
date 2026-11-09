import * as THREE from 'https://esm.sh/three@0.160';
import { createEmitter } from '../core/reactive.js';
import { createViewport3d } from './helpers/viewport3d.js';
import { createCameraControls } from './helpers/cameraControls.js';

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

      </div>

      <div class="output">
        <canvas></canvas>

        <div class="second-viewport">
          <canvas id="secondCanvas"></canvas>
        </div>
      </div>

    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');
  const secondCanvas = module.querySelector('#secondCanvas');

  const config = configNode.getConfig();

  // -------------------------
  // main viewport
  // -------------------------
  const viewport = createViewport3d(canvas, {
    size: config.viewportSize,
    background: config.background,
    cameraDistance: 18,
    far: 1000,
    ambient: 0.8
  });

  const scene = viewport.scene;

  // the camera always looks at the castle - this is kept up to date on
  // every rebuild(), after the raycast placement settles its position
  const castleTarget = new THREE.Vector3(0, 0, 0);

  const mainCameraControls = createCameraControls(viewport, canvas, {
    getTarget: () => castleTarget,
    radius: ISLAND_HALF + 4,
    height: ISLAND_HALF + 8,
    topHeight: ISLAND_HALF + 20,
    rotateSpeed: config.rotationSpeed,
    defaultMode: 'auto'
  });

  module.querySelector('.output').appendChild(mainCameraControls.el);

  // -------------------------
  // second viewport - same scene, independent camera + controls
  // -------------------------
  const secondRenderer = new THREE.WebGLRenderer({ canvas: secondCanvas, antialias: true });
  secondRenderer.setSize(config.viewportSize, config.viewportSize);
  secondRenderer.setClearColor(config.background);

  const secondCamera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
  const secondViewportStub = { camera: secondCamera };

  const secondCameraControls = createCameraControls(secondViewportStub, secondCanvas, {
    getTarget: () => castleTarget,
    radius: ISLAND_HALF + 4,
    height: ISLAND_HALF + 8,
    topHeight: ISLAND_HALF + 20,
    rotateSpeed: config.rotationSpeed,
    defaultMode: 'static'
  });

  module.querySelector('.second-viewport').appendChild(secondCameraControls.el);

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

    // material / color (configurable)
    if (castle.material) {
      castle.material = castle.material.clone();
      castle.material.color.setHex(configNode.getConfig().castleColor);
    }

    if (castle.geometry) {
      castle.geometry.computeVertexNormals();
    }

    world.add(castle);

    scene.add(world);

    // keep the cameras locked onto the castle's actual position
    const finalBBox = new THREE.Box3().setFromObject(castle);
    castleTarget.copy(finalBBox.getCenter(new THREE.Vector3()));

    emitter.emit();
  }

  configNode.subscribe(() => {
    const c = configNode.getConfig();

    viewport.setSize(c.viewportSize);
    viewport.setBackground(c.background);
    mainCameraControls.setRotateSpeed(c.rotationSpeed);

    secondRenderer.setSize(c.viewportSize, c.viewportSize);
    secondRenderer.setClearColor(c.background);
    secondCameraControls.setRotateSpeed(c.rotationSpeed);

    rebuild(); // castle color may have changed
  });

  viewport.startLoop(dt => {
    mainCameraControls.update(dt);
    secondCameraControls.update(dt);
    secondRenderer.render(scene, secondCamera);
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
