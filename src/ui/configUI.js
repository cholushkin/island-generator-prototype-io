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

        <label>Camera Orbit Speed <span class="val-speed">0.3</span></label>
        <input type="range" class="rotationSpeed" min="0" max="1" step="0.01" value="0.3">

        <label>Background</label>
        <input type="color" class="background" value="#111111">

        <label>Castle Color</label>
        <input type="color" class="castleColor" value="#e6ffe6">

      </div>
    </div>
  `;

  container.appendChild(module);

  const viewportSize = module.querySelector('.viewportSize');
  const rotationSpeed = module.querySelector('.rotationSpeed');
  const background = module.querySelector('.background');
  const castleColor = module.querySelector('.castleColor');

  const valSize = module.querySelector('.val-size');
  const valSpeed = module.querySelector('.val-speed');

  const emitter = createEmitter();

  const config = {
    viewportSize: 500,
    rotationSpeed: 0.3,
    background: 0x111111,
    castleColor: 0xe6ffe6
  };

  function update() {
    config.viewportSize = syncLabel(viewportSize, valSize, v => v.toFixed(0));
    config.rotationSpeed = syncLabel(rotationSpeed, valSpeed, v => v.toFixed(2));
    config.background = parseInt(background.value.slice(1), 16);
    config.castleColor = parseInt(castleColor.value.slice(1), 16);

    emitter.emit();
  }

  [viewportSize, rotationSpeed].forEach(el => el.addEventListener('input', update));
  background.addEventListener('input', update);
  castleColor.addEventListener('input', update);

  update();

  return {
    el: module,
    getConfig: () => config,
    subscribe: emitter.subscribe
  };
}
