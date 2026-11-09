import * as THREE from 'https://esm.sh/three@0.160';

export function createViewport3d(canvas, options = {}) {
  const {
    size = 500,
    background = 0x111111,
    cameraDistance = 2.5,
    fov = 60,
    near = 0.1,
    far = 1000,
    ambient = 0.6,
    directional = 1
  } = options;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(size, size);
  renderer.setClearColor(background);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  camera.position.set(cameraDistance, cameraDistance, cameraDistance);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, ambient));

  const light = new THREE.DirectionalLight(0xffffff, directional);
  light.position.set(cameraDistance, cameraDistance * 1.5, cameraDistance);
  scene.add(light);

  function setSize(px) {
    renderer.setSize(px, px);
  }

  function setBackground(color) {
    renderer.setClearColor(color);
  }

  // onFrame(dt) runs before each render, dt in seconds
  function startLoop(onFrame) {
    let last = performance.now();

    function animate() {
      requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      if (onFrame) onFrame(dt);

      renderer.render(scene, camera);
    }

    animate();
  }

  return {
    renderer,
    scene,
    camera,
    setSize,
    setBackground,
    startLoop
  };
}
