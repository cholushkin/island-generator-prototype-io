import * as THREE from 'https://esm.sh/three@0.160';

// Shared camera controls for a single viewport. Every mode drives the same
// camera and always looks at getTarget() - "look at the subject" is never
// optional, only how the camera gets there changes:
//
//  - auto:   camera orbits the target at a fixed radius/height
//  - static: camera snaps to one of 5 presets (4 corners + top-down),
//            cycled with the eye button
//  - free:   WASD moves the camera (Q/E for up/down), it keeps looking
//            at the target the whole time
export function createCameraControls(viewport, canvas, options = {}) {
  const {
    getTarget = () => new THREE.Vector3(0, 0, 0),
    radius = 3,
    height = 2,
    topHeight = radius * 2.2,
    rotateSpeed = 0.5,
    defaultMode = 'auto'
  } = options;

  let mode = defaultMode;
  let distanceScale = 1;
  let autoAngle = Math.PI * 0.25;
  let staticIndex = 0;
  let speed = rotateSpeed;

  const staticPresets = [
    { x: radius, y: height, z: radius, label: 'Corner NE' },
    { x: -radius, y: height, z: radius, label: 'Corner NW' },
    { x: -radius, y: height, z: -radius, label: 'Corner SW' },
    { x: radius, y: height, z: -radius, label: 'Corner SE' },
    { x: 0.0001, y: topHeight, z: 0.0001, label: 'Top', up: [0, 0, -1] }
  ];

  const freePos = new THREE.Vector3(radius, height, radius);
  const keys = {};
  let hovering = false;

  canvas.addEventListener('mouseenter', () => { hovering = true; });
  canvas.addEventListener('mouseleave', () => { hovering = false; });

  function onKeyDown(e) {
    if (!hovering || mode !== 'free') return;
    keys[e.key.toLowerCase()] = true;
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // -------------------------
  // control bar DOM
  // -------------------------
  const bar = document.createElement('div');
  bar.className = 'camera-controls';

  function makeButton(text, title) {
    const b = document.createElement('button');
    b.textContent = text;
    b.title = title;
    return b;
  }

  const autoBtn = makeButton('🔄', 'Auto-rotate');
  const staticBtn = makeButton('📷', 'Static cameras');
  const freeBtn = makeButton('🕹', 'Free fly (hover + WASD, Q/E)');
  const eyeBtn = makeButton('👁', 'Next camera angle');
  const zoomInBtn = makeButton('+', 'Zoom in');
  const zoomOutBtn = makeButton('-', 'Zoom out');
  const label = document.createElement('span');
  label.className = 'camera-controls-label';

  bar.append(autoBtn, staticBtn, freeBtn, eyeBtn, zoomInBtn, zoomOutBtn, label);

  function setMode(next) {
    mode = next;

    [autoBtn, staticBtn, freeBtn].forEach(b => b.classList.remove('active'));

    if (mode === 'auto') {
      autoBtn.classList.add('active');
      label.textContent = 'Auto-rotate';
    } else if (mode === 'static') {
      staticBtn.classList.add('active');
      label.textContent = staticPresets[staticIndex].label;
    } else if (mode === 'free') {
      freeBtn.classList.add('active');
      label.textContent = 'Free fly';
      freePos.copy(viewport.camera.position);
    }
  }

  autoBtn.addEventListener('click', () => setMode('auto'));
  staticBtn.addEventListener('click', () => setMode('static'));
  freeBtn.addEventListener('click', () => setMode('free'));

  eyeBtn.addEventListener('click', () => {
    if (mode !== 'static') {
      setMode('static');
    } else {
      staticIndex = (staticIndex + 1) % staticPresets.length;
      label.textContent = staticPresets[staticIndex].label;
    }
  });

  zoomInBtn.addEventListener('click', () => zoom(0.85));
  zoomOutBtn.addEventListener('click', () => zoom(1.18));

  function zoom(factor) {
    if (mode === 'free') {
      const target = getTarget();
      const toTarget = target.clone().sub(freePos);
      const dist = toTarget.length();

      // factor < 1 means zoom in (move closer)
      const step = dist * (1 - factor);
      if (toTarget.lengthSq() > 1e-6) {
        freePos.addScaledVector(toTarget.normalize(), step);
      }
    } else {
      distanceScale = Math.max(0.25, Math.min(3, distanceScale * factor));
    }
  }

  setMode(mode);

  // -------------------------
  // per-frame update
  // -------------------------
  function update(dt) {
    const target = getTarget();
    const camera = viewport.camera;

    if (mode === 'auto') {
      autoAngle += speed * dt;

      camera.up.set(0, 1, 0);
      camera.position.set(
        target.x + Math.cos(autoAngle) * radius * distanceScale,
        target.y + height * distanceScale,
        target.z + Math.sin(autoAngle) * radius * distanceScale
      );
      camera.lookAt(target);

    } else if (mode === 'static') {
      const p = staticPresets[staticIndex];

      camera.up.set(...(p.up || [0, 1, 0]));
      camera.position.set(
        target.x + p.x * distanceScale,
        target.y + p.y * distanceScale,
        target.z + p.z * distanceScale
      );
      camera.lookAt(target);

    } else if (mode === 'free') {
      const forward = new THREE.Vector3(
        target.x - freePos.x,
        0,
        target.z - freePos.z
      );

      if (forward.lengthSq() < 1e-6) forward.set(0, 0, 1);
      forward.normalize();

      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      const step = radius * 0.8 * dt;

      if (keys['w']) freePos.addScaledVector(forward, step);
      if (keys['s']) freePos.addScaledVector(forward, -step);
      if (keys['d']) freePos.addScaledVector(right, step);
      if (keys['a']) freePos.addScaledVector(right, -step);
      if (keys['e']) freePos.y += step;
      if (keys['q']) freePos.y -= step;

      camera.up.set(0, 1, 0);
      camera.position.copy(freePos);
      camera.lookAt(target);
    }
  }

  function setRotateSpeed(v) {
    speed = v;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  return {
    el: bar,
    update,
    setRotateSpeed,
    dispose
  };
}
