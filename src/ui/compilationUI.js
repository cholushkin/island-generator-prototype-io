import * as THREE from 'https://esm.sh/three@0.160';

export function createCompilationModule(container) {

  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>Compilation</span>
      <span>Final Scene</span>
    </div>

    <div class="module-body">

      <div class="controls">

        <label>Offset X</label>
        <input
          type="range"
          id="ox"
          min="-5"
          max="5"
          step="0.01"
          value="0"
        >

        <label>Offset Y</label>
        <input
          type="range"
          id="oy"
          min="-5"
          max="5"
          step="0.01"
          value="1"
        >

        <label>Offset Z</label>
        <input
          type="range"
          id="oz"
          min="-5"
          max="5"
          step="0.01"
          value="0"
        >

        <label>Scale XZ</label>
        <input
          type="range"
          id="sxz"
          min="0.1"
          max="5"
          step="0.01"
          value="0.5"
        >

        <label>Scale Y</label>
        <input
          type="range"
          id="sy"
          min="0.1"
          max="5"
          step="0.01"
          value="0.5"
        >

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

  // canvas
  const canvas = module.querySelector('canvas');

  // renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  });

  renderer.setSize(500, 500);
  renderer.setClearColor(0x111111);

  // scene
  const scene = new THREE.Scene();

  // camera
  const camera = new THREE.PerspectiveCamera(
    60,
    1,
    0.1,
    1000
  );

  camera.position.set(18, 14, 18);
  camera.lookAt(0, 0, 0);

  // lights
  const ambient = new THREE.AmbientLight(
    0xffffff,
    0.8
  );

  scene.add(ambient);

  const light = new THREE.DirectionalLight(
    0xffffff,
    1
  );

  light.position.set(5, 10, 5);

  scene.add(light);

  // controls
  const ox = module.querySelector('#ox');
  const oy = module.querySelector('#oy');
  const oz = module.querySelector('#oz');

  const sxz = module.querySelector('#sxz');
  const sy = module.querySelector('#sy');

  const zoomIn = module.querySelector('#zoomIn');
  const zoomOut = module.querySelector('#zoomOut');

  // mesh providers
  let getTerrain = null;
  let getMarching = null;

  // final world
  let world = null;

  // realtime rebuild
  [
    ox,
    oy,
    oz,
    sxz,
    sy
  ].forEach(el => {
    el.addEventListener('input', rebuild);
  });

  // zoom
  zoomIn.addEventListener('click', () => {
    camera.position.multiplyScalar(0.8);
  });

  zoomOut.addEventListener('click', () => {
    camera.position.multiplyScalar(1.2);
  });

  function rebuild() {

    if (!getTerrain) return;
    if (!getMarching) return;

    const terrainSource = getTerrain();
    const mcSource = getMarching();

    if (!terrainSource) return;
    if (!mcSource) return;

    // remove previous world
    if (world) {
      scene.remove(world);
    }

    // create new world
    world = new THREE.Group();

    // -------------------------
    // TERRAIN
    // -------------------------

    const terrain = terrainSource.clone();

    // make island bigger
    terrain.scale.set(20, 20, 20);

    terrain.position.set(0, 0, 0);

    world.add(terrain);

    // -------------------------
    // MARCHING CUBES MODEL
    // -------------------------

    const mc = mcSource.clone();

    // reset transforms
    mc.position.set(0, 0, 0);
    mc.rotation.set(0, 0, 0);

    // params
    const scaleXZ = parseFloat(sxz.value);
    const scaleY = parseFloat(sy.value);

    // FIX:
    // negative Y flips upright
    mc.scale.set(
      scaleXZ * 2,
      -scaleY * 2,
      scaleXZ * 2
    );

    // position
    mc.position.set(
      parseFloat(ox.value),
      parseFloat(oy.value),
      parseFloat(oz.value)
    );

    // compensate for terrain scaling
    mc.position.x *= 8;
    mc.position.y *= 8;
    mc.position.z *= 8;

    // material
    if (mc.material) {

      mc.material = mc.material.clone();

      mc.material.color.setRGB(
        0.9,
        1.0,
        0.9
      );
    }

    // recompute normals
    if (mc.geometry) {
      mc.geometry.computeVertexNormals();
    }

    world.add(mc);

    scene.add(world);
  }

  // render loop
  function animate() {

    requestAnimationFrame(animate);

    if (world) {
      world.rotation.y += 0.003;
    }

    renderer.render(scene, camera);
  }

  animate();

  // public API
  return {

    setTerrain(fn) {
      getTerrain = fn;
      rebuild();
    },

    setMarching(fn) {
      getMarching = fn;
      rebuild();
    },

    rebuild,

    getOutput() {
      return world;
    }
  };
}