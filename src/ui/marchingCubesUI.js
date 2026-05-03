import * as THREE from 'https://esm.sh/three@0.160';

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

  const blobs = [
    [4, 4, 4],
    [10, 10, 8],
    [8, 6, 12]
  ];

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {

        let v = 0;

        for (let b of blobs) {
          const dx = x - b[0];
          const dy = y - b[1];
          const dz = z - b[2];

          const dist = dx * dx + dy * dy + dz * dz;

          if (dist < 10) v = 1;
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
      <span>3D Field (Dots)</span>
    </div>
    <div class="module-body">
      <canvas></canvas>
    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');

  canvas.width = 500;
  canvas.height = 500;
  canvas.style.width = '500px';
  canvas.style.height = '500px';
  canvas.style.display = 'block';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(500, 500);
  renderer.setClearColor(0x222222);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const group = new THREE.Group();
  scene.add(group);

  const size = 16;
  const field = generateBlobs(size);

  const cubeSize = 2; // 🔥 twice bigger
  const spacing = cubeSize / size;

  const filledGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const emptyGeo = new THREE.SphereGeometry(0.01, 6, 6);

  const filledMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
  const emptyMat = new THREE.MeshBasicMaterial({ color: 0x444444 });

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {

        const isFilled = field.get(x, y, z) > 0;

        const geo = isFilled ? filledGeo : emptyGeo;
        const mat = isFilled ? filledMat : emptyMat;

        const m = new THREE.Mesh(geo, mat);

        m.position.set(
          x * spacing - cubeSize / 2,
          y * spacing - cubeSize / 2,
          z * spacing - cubeSize / 2
        );

        group.add(m);
      }
    }
  }

  // ✅ cube edges only (no diagonals)
  const edges = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
  );

  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );

  group.add(line);

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