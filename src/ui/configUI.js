import { createEmitter } from '../core/reactive.js';
import { syncLabel } from './helpers/controls.js';

export function createConfigModule(container) {
  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>1. Config</span>
    </div>

    <div class="module-body">
      <div class="controls">

        <label>3D Viewport Size <span class="val-size">500</span></label>
        <input type="range" class="viewportSize" min="300" max="700" step="10" value="500">

        <label>
          <input type="checkbox" class="autoRotate" checked>
          Auto Rotate
        </label>

        <label>Rotation Speed <span class="val-speed">0.003</span></label>
        <input type="range" class="rotationSpeed" min="0" max="0.02" step="0.001" value="0.003">

        <label>Background</label>
        <input type="color" class="background" value="#111111">

      </div>
    </div>
  `;

  container.appendChild(module);

  const viewportSize = module.querySelector('.viewportSize');
  const autoRotate = module.querySelector('.autoRotate');
  const rotationSpeed = module.querySelector('.rotationSpeed');
  const background = module.querySelector('.background');

  const valSize = module.querySelector('.val-size');
  const valSpeed = module.querySelector('.val-speed');

  const emitter = createEmitter();

  const config = {
    viewportSize: 500,
    autoRotate: true,
    rotationSpeed: 0.003,
    background: 0x111111
  };

  function update() {
    config.viewportSize = syncLabel(viewportSize, valSize, v => v.toFixed(0));
    config.autoRotate = autoRotate.checked;
    config.rotationSpeed = syncLabel(rotationSpeed, valSpeed, v => v.toFixed(3));
    config.background = parseInt(background.value.slice(1), 16);

    emitter.emit();
  }

  [viewportSize, rotationSpeed].forEach(el => el.addEventListener('input', update));
  autoRotate.addEventListener('change', update);
  background.addEventListener('input', update);

  update();

  return {
    el: module,
    getConfig: () => config,
    subscribe: emitter.subscribe
  };
}
